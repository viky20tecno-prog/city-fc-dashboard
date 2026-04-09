import { useState, useEffect } from 'react';
import { ChevronRight, Edit2, Trash2 } from 'lucide-react';

export default function ArbitrajeListadoPartidos({ clubId, onViewPagos }) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPartidos();
  }, [clubId]);

  const fetchPartidos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/arbitrage/partidos?club_id=${clubId}`
      );
      if (!response.ok) throw new Error('Error al cargar partidos');
      const data = await response.json();
      setPartidos(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Cargando...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Partidos Registrados</h2>
        <p className="text-gray-600 text-sm">Total: {partidos.length} partidos</p>
      </div>

      {partidos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay partidos registrados aún.</p>
          <p className="text-gray-400 text-sm">Crea uno en la pestaña "Crear Partido"</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Título</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Hora</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Equipos</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Monto</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {partidos.map((partido) => (
                <tr key={partido.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{partido.titulo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{partido.fecha}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{partido.hora}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="inline-flex gap-1">
                      <span className="font-medium">{partido.equipoA}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="font-medium">{partido.equipoB}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    ${parseInt(partido.montoTotal).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onViewPagos(partido.id)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600 transition"
                        title="Ver pagos"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => alert('Editar no disponible aún')}
                        className="p-1 hover:bg-yellow-100 rounded text-yellow-600 transition"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => alert('Eliminar no disponible aún')}
                        className="p-1 hover:bg-red-100 rounded text-red-600 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
