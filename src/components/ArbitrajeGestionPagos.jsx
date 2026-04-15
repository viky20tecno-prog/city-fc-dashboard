import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, Circle, Loader2, Check, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../config';

const fmt = (n) =>
  Math.round(Number(n)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const fmtFecha = (fecha) => {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
};

const METODOS = [
  { id: 'EFECTIVO',      label: 'Efectivo',     emoji: '💵' },
  { id: 'TRANSFERENCIA', label: 'Transferencia', emoji: '📲' },
  { id: 'AGUAS',         label: 'Aguas',         emoji: '💧' },
];

export default function ArbitrajeGestionPagos({ clubId, partidoId }) {
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null);
  const [metodoPago, setMetodoPago] = useState('');
  const [guardando, setGuardando] = useState(false);

  const fetchData = useCallback(async () => {
    if (!partidoId) return;
    setLoading(true);
    setError(null);
    try {
      const [resPagos, resResumen] = await Promise.all([
        fetch(`${API_BASE_URL}/arbitrage/pagos/${partidoId}?club_id=${clubId}`),
        fetch(`${API_BASE_URL}/arbitrage/resumen/${partidoId}?club_id=${clubId}`),
      ]);
      const dataPagos = await resPagos.json();
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
      const res = await fetch(`${API_BASE_URL}/arbitrage/pagos?club_id=${clubId}`, {
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

  // ── Sin partido seleccionado ─────────────────────────────────────────────────
  if (!partidoId) {
    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">👈</div>
        <h3 className="text-white font-semibold mb-2">Selecciona un partido</h3>
        <p className="text-gray-400 text-sm">
          Ve a la pestaña <span className="text-green-400 font-medium">Partidos</span> y haz clic en "Ver pagos".
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
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

      {/* ── Resumen financiero ── */}
      {resumen && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">

          {/* Título del partido */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Partido</p>
              <h3 className="text-white font-bold text-base leading-tight">
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
                  {fmtFecha(resumen.fecha)}
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
              <span className="text-white font-medium">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Monto total', value: fmt(resumen.montoTotal),    color: 'text-white' },
              { label: 'Recaudado',   value: fmt(resumen.totalRecaudado), color: 'text-green-400' },
              { label: 'Pendiente',   value: fmt(resumen.faltante),       color: 'text-orange-400' },
              { label: 'Sin pagar',   value: `${resumen.cantidadPendiente} de ${resumen.cantidadTotal}`, color: 'text-yellow-400' },
            ].map((m) => (
              <div key={m.label} className="bg-gray-800/60 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className={`font-bold text-sm ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lista de pagos ── */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">Registro de pagos individuales</h3>
        </div>

        {pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No hay jugadores asignados a este partido.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {pagos.map((pago) => (
              <div key={pago.cedula} className="px-5 py-4">

                {/* Fila: [icono + nombre] [valor centro] [estado/botón derecha] */}
                <div className="flex items-center gap-3">

                  {/* Icono estado */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    pago.estadoPago ? 'bg-green-900/50' : 'bg-gray-800'
                  }`}>
                    {pago.estadoPago
                      ? <CheckCircle size={16} className="text-green-400" />
                      : <Circle size={16} className="text-gray-600" />
                    }
                  </div>

                  {/* Nombre y cédula */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{pago.nombre}</p>
                    <p className="text-gray-500 text-xs">{pago.cedula}</p>
                  </div>

                  {/* Valor — centro */}
                  <div className="text-center px-3 shrink-0">
                    <p className="text-white font-bold text-sm">{fmt(pago.valor)}</p>
                  </div>

                  {/* Estado / botón — derecha */}
                  <div className="shrink-0 text-right min-w-[110px]">
                    {pago.estadoPago ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
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
                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2"
                      >
                        Pendiente — registrar
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel de métodos de pago (se despliega debajo) */}
                {!pago.estadoPago && editando === pago.cedula && (
                  <div className="mt-4 ml-11 space-y-3">
                    <p className="text-xs text-gray-400">Selecciona el método de pago:</p>

                    {/* Botones de método */}
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
                                ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/40 scale-105'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                            {selected && <Check size={13} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Confirmar */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRegistrarPago(pago.cedula)}
                        disabled={!metodoPago || guardando}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
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
