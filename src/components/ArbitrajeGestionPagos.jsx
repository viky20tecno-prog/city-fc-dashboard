import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function ArbitrajeGestionPagos({ clubId, partidoId }) {
  const [pagos, setPageos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editMetodo, setEditMetodo] = useState('');

  useEffect(() => {
    if (partidoId) {
      fetchPagos();
      fetchResumen();
    } else {
      setLoading(false);
    }
  }, [clubId, partidoId]);

  const fetchPagos = async () => {
    try {
      const response = await fetch(
        `/api/arbitrage/pagos/${partidoId}?club_id=${clubId}`
      );
      if (!response.ok) throw new Error('Error al cargar pagos');
      const data = await response.json();
      setPageos(data.pagos || []);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    }
  };

  const fetchResumen = async () => {
    try {
      const response = await fetch(
        `/api/arbitrage/resumen/${partidoId}?club_id=${clubId}`
      );
      if (!response.ok) throw new Error('Error al cargar resumen');
      const data = await response.json();
      setResumen(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPago = async (pagoId, cedula) => {
    if (!editMetodo) {
      alert('Método de pago requerido');
      return;
    }

    try {
      const response = await fetch(`/api/arbitrage/pagos?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partidoId,
          cedula,
          metodoPago: editMetodo,
          estadoPago: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar pago');
      }

      setEditingId(null);
      setEditMetodo('');
      fetchPagos();
      fetchResumen();
    } catch (err) {
      alert(err.message);
      console.error('Error:', err);
    }
  };

  if (!partidoId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Selecciona un partido para ver sus pagos</p>
      </div>
    );
  }

  if (loading) return <div className="text-center text-gray-600">Cargando...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestión de Pagos</h2>

      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Partido</p>
            <p className="text-2xl font-bold text-blue-900">
              ${resumen.montoTotal.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Recaudado</p>
            <p className="text-2xl font-bold text-green-900">
              ${resumen.totalRecaudado.toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-green-600 mt-1">{resumen.porcentajePagado}%</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-medium">Pendiente</p>
            <p className="text-2xl font-bold text-yellow-900">
              ${resumen.faltante.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Sin Registrar</p>
            <p className="text-2xl font-bold text-red-900">{resumen.cantidadPendiente}</p>
            <p className="text-xs text-red-600 mt-1">de {resumen.cantidadTotal}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Checklist de Pagos</h3>
        {pagos.length === 0 ? (
          <p className="text-gray-600 text-sm">No hay pagos registrados para este partido</p>
        ) : (
          pagos.map(pago => (
            <div
              key={pago.id}
              className={`p-4 rounded-lg border transition ${
                pago.estadoPago
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center ${
                      pago.estadoPago
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {pago.estadoPago && <Check size={16} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{pago.nombre}</p>
                    <p className="text-sm text-gray-600">{pago.cedula}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900">
                    ${pago.valor.toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="flex-shrink-0 w-40">
                  {pago.estadoPago ? (
                    <div>
                      <p className="text-sm font-medium text-green-700">{pago.metodoPago}</p>
                    </div>
                  ) : editingId === pago.id ? (
                    <div className="flex gap-2">
                      <select
                        value={editMetodo}
                        onChange={(e) => setEditMetodo(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Método...</option>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="AGUAS">Aguas</option>
                      </select>
                      <button
                        onClick={() => handleRegisterPago(pago.id, pago.cedula)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditMetodo('');
                        }}
                        className="px-2 py-1 bg-gray-300 text-white rounded text-sm hover:bg-gray-400 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(pago.id);
                        setEditMetodo('');
                      }}
                      className="w-full px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                    >
                      Registrar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
