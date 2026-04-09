import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

export default function ArbitrajeCrearPartido({ clubId, onCreated }) {
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    equipoA: '',
    equipoB: '',
    montoTotal: ''
  });

  const [jugadores, setJugadores] = useState([]);
  const [selectedJugadores, setSelectedJugadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchJugadores();
  }, [clubId]);

  const fetchJugadores = async () => {
    try {
      const response = await fetch(`/api/players?club_id=${clubId}`);
      if (!response.ok) throw new Error('Error al cargar jugadores');
      const data = await response.json();
      setJugadores(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleJugador = (cedula) => {
    setSelectedJugadores(prev =>
      prev.includes(cedula)
        ? prev.filter(c => c !== cedula)
        : [...prev, cedula]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.titulo || !formData.fecha || !formData.hora || 
        !formData.equipoA || !formData.equipoB || !formData.montoTotal ||
        selectedJugadores.length === 0) {
      setError('Todos los campos son requeridos y debes seleccionar jugadores');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/arbitrage/partidos?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          montoTotal: parseInt(formData.montoTotal),
          jugadoresCedulas: selectedJugadores
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear partido');
      }

      const data = await response.json();
      setSuccess(true);
      
      setFormData({
        titulo: '',
        fecha: '',
        hora: '',
        equipoA: '',
        equipoB: '',
        montoTotal: ''
      });
      setSelectedJugadores([]);

      setTimeout(() => onCreated(), 1500);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Crear Nuevo Partido</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✅ Partido creado exitosamente. Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título del Partido</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="ej: Partido Amistoso vs Millonarios"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto Total</label>
            <input
              type="number"
              name="montoTotal"
              value={formData.montoTotal}
              onChange={handleInputChange}
              placeholder="ej: 130000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipo A</label>
            <input
              type="text"
              name="equipoA"
              value={formData.equipoA}
              onChange={handleInputChange}
              placeholder="ej: City FC"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipo B</label>
            <input
              type="text"
              name="equipoB"
              value={formData.equipoB}
              onChange={handleInputChange}
              placeholder="ej: Independiente"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Selecciona Jugadores ({selectedJugadores.length})
          </label>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
            {jugadores.length === 0 ? (
              <p className="text-gray-600 text-sm">No hay jugadores disponibles</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jugadores.map(jugador => (
                  <label
                    key={jugador.cedula}
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedJugadores.includes(jugador.cedula)}
                      onChange={() => toggleJugador(jugador.cedula)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-900">{jugador.nombre || jugador['nombre(s)']}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            {loading ? 'Creando...' : 'Crear Partido'}
          </button>
        </div>
      </form>
    </div>
  );
}
