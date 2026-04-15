import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, Circle, Loader2, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../config';

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'AGUAS'];

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

      {/* Resumen financiero */}
      {resumen && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Resumen del partido</h3>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
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
              { label: 'Monto total',  value: fmt(resumen.montoTotal),      color: 'text-white' },
              { label: 'Recaudado',    value: fmt(resumen.totalRecaudado),   color: 'text-green-400' },
              { label: 'Pendiente',    value: fmt(resumen.faltante),         color: 'text-orange-400' },
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

      {/* Lista de pagos */}
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
                <div className="flex items-start justify-between gap-4">

                  {/* Info jugador */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      pago.estadoPago ? 'bg-green-900/50' : 'bg-gray-800'
                    }`}>
                      {pago.estadoPago
                        ? <CheckCircle size={16} className="text-green-400" />
                        : <Circle size={16} className="text-gray-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{pago.nombre}</p>
                      <p className="text-gray-500 text-xs">{pago.cedula}</p>
                    </div>
                  </div>

                  {/* Monto y estado */}
                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold text-sm">{fmt(pago.valor)}</p>
                    {pago.estadoPago
                      ? <span className="text-xs text-green-400">{pago.metodoPago || 'Pagado'}</span>
                      : <span className="text-xs text-orange-400">Pendiente</span>
                    }
                  </div>
                </div>

                {/* Acción de pago */}
                {!pago.estadoPago && (
                  <div className="mt-3 ml-11">
                    {editando === pago.cedula ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={metodoPago}
                          onChange={(e) => setMetodoPago(e.target.value)}
                          className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-green-500"
                        >
                          <option value="">Método de pago...</option>
                          {METODOS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRegistrarPago(pago.cedula)}
                          disabled={!metodoPago || guardando}
                          className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          {guardando
                            ? <Loader2 size={13} className="animate-spin" />
                            : <CheckCircle size={13} />
                          }
                          Confirmar
                        </button>
                        <button
                          onClick={() => { setEditando(null); setMetodoPago(''); }}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditando(pago.cedula); setMetodoPago(''); }}
                        className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors"
                      >
                        <ChevronDown size={13} />
                        Registrar pago
                      </button>
                    )}
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
