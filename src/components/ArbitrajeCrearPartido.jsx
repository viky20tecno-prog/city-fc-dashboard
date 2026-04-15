import { useState, useEffect } from 'react';
import { Plus, X, CheckSquare, Square, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ArbitrajeCrearPartido({ clubId, onCreated }) {
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    equipoA: '',
    equipoB: '',
    montoTotal: '',
  });
  const [jugadores, setJugadores] = useState([]);
  const [selectedJugadores, setSelectedJugadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingJugadores, setLoadingJugadores] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchJugadores = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/players?club_id=${clubId}`);
        if (!res.ok) throw new Error('Error al cargar jugadores');
        const data = await res.json();
        setJugadores(data.data || []);
      } catch (err) {
        console.error('Error cargando jugadores:', err);
      } finally {
        setLoadingJugadores(false);
      }
    };
    fetchJugadores();
  }, [clubId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleJugador = (cedula) => {
    setSelectedJugadores(prev =>
      prev.includes(cedula) ? prev.filter(c => c !== cedula) : [...prev, cedula]
    );
  };

  const toggleTodos = () => {
    if (selectedJugadores.length === jugadores.length) {
      setSelectedJugadores([]);
    } else {
      setSelectedJugadores(jugadores.map(j => j.cedula));
    }
  };

  const valorPorJugador = selectedJugadores.length > 0 && formData.montoTotal
    ? Math.round(Number(formData.montoTotal) / selectedJugadores.length)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.titulo || !formData.fecha || !formData.hora ||
        !formData.equipoA || !formData.equipoB || !formData.montoTotal) {
      return setError('Completa todos los campos del formulario.');
    }
    if (selectedJugadores.length === 0) {
      return setError('Selecciona al menos un jugador para el pago.');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/arbitrage/partidos?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          montoTotal: parseInt(formData.montoTotal),
          jugadoresCedulas: selectedJugadores,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al crear el partido');

      setSuccess(true);
      setFormData({ titulo: '', fecha: '', hora: '', equipoA: '', equipoB: '', montoTotal: '' });
      setSelectedJugadores([]);
      setTimeout(() => { setSuccess(false); onCreated(); }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gray-900/60 border border-green-800 rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-green-400 font-semibold text-lg mb-2">Partido registrado con éxito</h3>
        <p className="text-gray-400 text-sm">Redirigiendo al listado...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
      <h2 className="text-white font-semibold text-lg mb-6">Registrar nuevo partido</h2>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Título */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Título del partido</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleInputChange}
            placeholder="Ej: Torneo Copa Ciudad – Semifinal"
            className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Hora</label>
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>
        </div>

        {/* Equipos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Equipo A (local)</label>
            <input
              type="text"
              name="equipoA"
              value={formData.equipoA}
              onChange={handleInputChange}
              placeholder="Ej: City FC"
              className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Equipo B (visitante)</label>
            <input
              type="text"
              name="equipoB"
              value={formData.equipoB}
              onChange={handleInputChange}
              placeholder="Ej: Independiente"
              className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Monto total árbitros (COP)</label>
          <input
            type="number"
            name="montoTotal"
            value={formData.montoTotal}
            onChange={handleInputChange}
            placeholder="Ej: 150000"
            min="0"
            className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        {/* Jugadores */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">
              Jugadores que pagan ({selectedJugadores.length} seleccionados)
            </label>
            {jugadores.length > 0 && (
              <button
                type="button"
                onClick={toggleTodos}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                {selectedJugadores.length === jugadores.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            )}
          </div>

          {valorPorJugador > 0 && (
            <div className="mb-2 px-3 py-2 bg-green-900/20 border border-green-800/50 rounded-lg text-sm text-green-400">
              Cada jugador paga:{' '}
              <strong>
                {valorPorJugador.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </strong>
            </div>
          )}

          {loadingJugadores ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <Loader2 size={14} className="animate-spin" />
              Cargando jugadores...
            </div>
          ) : jugadores.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No hay jugadores activos en el club.</p>
          ) : (
            <div className="max-h-52 overflow-y-auto border border-gray-700 rounded-lg divide-y divide-gray-800">
              {jugadores.map(j => {
                const nombre = j['nombre(s)'] || j.nombre || '';
                const selected = selectedJugadores.includes(j.cedula);
                return (
                  <button
                    key={j.cedula}
                    type="button"
                    onClick={() => toggleJugador(j.cedula)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selected ? 'bg-green-900/20' : 'hover:bg-gray-800'
                    }`}
                  >
                    {selected
                      ? <CheckSquare size={16} className="text-green-400 shrink-0" />
                      : <Square size={16} className="text-gray-600 shrink-0" />
                    }
                    <div>
                      <p className="text-sm text-white">{nombre} {j.apellidos || ''}</p>
                      <p className="text-xs text-gray-500">{j.cedula}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            <X size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Registrando...</>
            : <><Plus size={16} /> Registrar Partido</>
          }
        </button>
      </form>
    </div>
  );
}
