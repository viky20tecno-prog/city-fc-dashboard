import { useState } from 'react';
import { Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function UniformesTab({ jugadores }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    cedula: '',
    tipo_uniforme: 'General',
    numero: '',
    nombre_estampar: '',
    talla: 'M'
  });

  const tiposUniformes = [
    { valor: 'General', precio: 90000 },
    { valor: 'Campeones EVG/SAB', precio: 60000 },
    { valor: 'Arqueros EVG/SAB', precio: 120000 },
    { valor: 'Arqueros General', precio: 160000 }
  ];

  const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/uniforme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error registrando uniforme' });
        return;
      }

      setMessage({ type: 'success', text: `Uniforme registrado: ${data.uniforme.nombre_estampar} #${data.uniforme.numero}` });
      setForm({ cedula: '', tipo_uniforme: 'General', numero: '', nombre_estampar: '', talla: 'M' });
      setTimeout(() => setMostrarModal(false), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  const precioActual = tiposUniformes.find(t => t.valor === form.tipo_uniforme)?.precio || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#E6EDF3]">Gestión de Uniformes</h2>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00D084] text-[#0D1117] rounded-lg font-medium hover:bg-[#00D084]/80 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Uniforme
        </button>
      </div>

      {/* Modal Nuevo Uniforme */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#E6EDF3] mb-4">Registrar Uniforme</h3>

            {message.text && (
              <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${message.type === 'error' ? 'bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/20' : 'bg-[rgba(0,208,132,0.12)] border border-[#00D084]/20'}`}>
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-[#FF5E5E] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-[#00D084] shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${message.type === 'error' ? 'text-[#FF5E5E]' : 'text-[#00D084]'}`}>
                  {message.text}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Jugador */}
              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Seleccionar Jugador *
                </label>
                <select
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  <option value="">-- Selecciona jugador --</option>
                  {jugadores && jugadores.map(j => (
                    <option key={j.cedula} value={j.cedula}>
                      {j.nombre} {j.apellidos} ({j.cedula})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Uniforme */}
              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Tipo Uniforme *
                </label>
                <select
                  name="tipo_uniforme"
                  value={form.tipo_uniforme}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  {tiposUniformes.map(t => (
                    <option key={t.valor} value={t.valor}>
                      {t.valor} (${t.precio.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Número Camiseta */}
              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Número Camiseta (1-99) *
                </label>
                <input
                  type="number"
                  name="numero"
                  min="1"
                  max="99"
                  value={form.numero}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                />
              </div>

              {/* Nombre a Estampar */}
              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Nombre a Estampar (máx 12 caracteres) *
                </label>
                <input
                  type="text"
                  name="nombre_estampar"
                  maxLength="12"
                  value={form.nombre_estampar}
                  onChange={handleChange}
                  placeholder="Ej: DIEGO"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                />
                <p className="text-xs text-[#8B949E] mt-1">
                  {form.nombre_estampar.length}/12
                </p>
              </div>

              {/* Talla */}
              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Talla *
                </label>
                <select
                  name="talla"
                  value={form.talla}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  {tallas.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Resumen precio */}
              <div className="bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
                <p className="text-xs text-[#8B949E]">Valor:</p>
                <p className="text-lg font-bold text-[#00D084]">
                  ${precioActual.toLocaleString()} COP
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#30363D] text-[#E6EDF3] rounded-lg font-medium hover:bg-[#30363D]/80 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#00D084] text-[#0D1117] rounded-lg font-medium hover:bg-[#00D084]/80 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Placeholder Info */}
      <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-6 text-center">
        <p className="text-[#8B949E]">
          Haz click en "Nuevo Uniforme" para registrar uniformes de los jugadores
        </p>
      </div>
    </div>
  );
}
