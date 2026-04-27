import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Eye, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const fmtFecha = (fecha) => {
  if (!fecha) return '-';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
};

export default function ArbitrajeListadoPartidos({ clubId, onViewPagos }) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPartidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/arbitrage/partidos?club_id=${clubId}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPartidos(data.data || []);
    } catch (err) {
      setError('No se pudieron cargar los partidos. Verifica la conexión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartidos(); }, [clubId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Cargando partidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchPartidos}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-800/50 hover:bg-red-700/50 text-red-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className="bg-[#161D2F] border border-[#2A3655] rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">🏟️</div>
        <h3 className="text-white font-semibold text-lg mb-2">Sin partidos registrados</h3>
        <p className="text-gray-400 text-sm">
          Ve a la pestaña <span className="text-orange-400 font-medium">Registrar Partido</span> para agregar el primero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contador y refresh */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">
          {partidos.length} partido{partidos.length !== 1 ? 's' : ''} registrado{partidos.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={fetchPartidos}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1E2740] hover:bg-[#24305A] text-gray-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        {partidos.map((partido) => (
          <div
            key={partido.id}
            className="bg-[#161D2F] border border-[#2A3655] hover:border-[#2A3655] rounded-xl p-5 transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base truncate mb-2">
                  {partido.titulo}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-green-500" />
                    {fmtFecha(partido.fecha)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-green-500" />
                    {partido.hora || '-'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-green-500" />
                    {partido.equipoA}
                    <span className="text-gray-600 mx-1">vs</span>
                    {partido.equipoB}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Monto total</p>
                  <p className="text-orange-400 font-bold">{fmt(partido.montoTotal)}</p>
                </div>
                <button
                  onClick={() => onViewPagos(partido.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye size={14} />
                  Ver pagos
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
