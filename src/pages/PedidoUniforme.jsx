import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, Shirt } from 'lucide-react';

export default function PedidoUniforme() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    cedula: '',
    tipo: 'General',
    talla: 'M',
    nombre_estampar: '',
    numero_estampar: ''
  });
  const [jugadores, setJugadores] = useState([]);
  const [jugadoresLoading, setJugadoresLoading] = useState(true);

  // Cargar jugadores al montar
  useState(() => {
    (async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const sheetId = '1oyrm3WeCXJbmxMhSWFjhnvpZ2XDr6DK9Dm__rLqO6gA';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/JUGADORES!A:C?key=${apiKey}&_t=${Date.now()}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.values && data.values.length > 1) {
          const [_, ...rows] = data.values;
          const jugs = rows.map(row => ({
            cedula: row[0],
            nombre: row[1] || '',
            apellidos: row[2] || ''
          })).filter(j => j.cedula);
          setJugadores(jugs);
        }
      } catch (err) {
        console.error('Error cargando jugadores:', err);
      } finally {
        setJugadoresLoading(false);
      }
    })();
  }, []);

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
      const res = await fetch('/api/pedido-uniforme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: form.cedula,
          tipo: form.tipo,
          talla: form.talla,
          nombre_estampar: form.nombre_estampar,
          numero_estampar: form.numero_estampar
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error registrando pedido' });
        return;
      }

      setMessage({ type: 'success', text: `✅ Pedido guardado: ${data.pedido.nombre_estampar} #${data.pedido.numero_estampar}` });
      setForm({ cedula: '', tipo: 'General', talla: 'M', nombre_estampar: '', numero_estampar: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  const precioActual = tiposUniformes.find(t => t.valor === form.tipo)?.precio || 0;
  const jugadorSeleccionado = jugadores.find(j => j.cedula === form.cedula);

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Header */}
      <header className="bg-[#161B22] border-b border-[#30363D]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Shirt className="w-8 h-8 text-[#00D084]" />
            <h1 className="text-3xl font-bold text-[#E6EDF3]">Pedido de Uniforme</h1>
          </div>
          <p className="text-[#8B949E]">Registra nuevos pedidos de uniformes para los jugadores</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Mensaje */}
            {message.text && (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${message.type === 'error' ? 'bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/20' : 'bg-[rgba(0,208,132,0.12)] border border-[#00D084]/20'}`}>
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-[#FF5E5E] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-[#00D084] shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${message.type === 'error' ? 'text-[#FF5E5E]' : 'text-[#00D084]'}`}>
                  {message.text}
                </span>
              </div>
            )}

            {/* Jugador */}
            <div>
              <label className="block text-sm font-semibold text-[#E6EDF3] mb-2">
                Seleccionar Jugador *
              </label>
              {jugadoresLoading ? (
                <div className="p-3 bg-[#1E2530] rounded-lg text-[#8B949E]">Cargando jugadores...</div>
              ) : (
                <select
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
                >
                  <option value="">-- Selecciona un jugador --</option>
                  {jugadores.map(j => (
                    <option key={j.cedula} value={j.cedula}>
                      {j.nombre} {j.apellidos} ({j.cedula})
                    </option>
                  ))}
                </select>
              )}
              {jugadorSeleccionado && (
                <p className="text-xs text-[#00D084] mt-2">
                  ✓ {jugadorSeleccionado.nombre} {jugadorSeleccionado.apellidos}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-[#E6EDF3] mb-2">
                  Tipo de Uniforme *
                </label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  {tiposUniformes.map(t => (
                    <option key={t.valor} value={t.valor}>
                      {t.valor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Talla */}
              <div>
                <label className="block text-sm font-semibold text-[#E6EDF3] mb-2">
                  Talla *
                </label>
                <select
                  name="talla"
                  value={form.talla}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  {tallas.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nombre a Estampar */}
              <div>
                <label className="block text-sm font-semibold text-[#E6EDF3] mb-2">
                  Nombre a Estampar (máx 12) *
                </label>
                <input
                  type="text"
                  name="nombre_estampar"
                  maxLength="12"
                  value={form.nombre_estampar}
                  onChange={handleChange}
                  placeholder="Ej: DIEGO"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                />
                <p className="text-xs text-[#8B949E] mt-1">{form.nombre_estampar.length}/12</p>
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-semibold text-[#E6EDF3] mb-2">
                  Número Camiseta (1-99) *
                </label>
                <input
                  type="number"
                  name="numero_estampar"
                  min="1"
                  max="99"
                  value={form.numero_estampar}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-[#0D1117] rounded-lg p-4 border border-[#30363D]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#8B949E] mb-1">Tipo Seleccionado</p>
                  <p className="font-semibold text-[#E6EDF3]">{form.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8B949E] mb-1">Valor del Uniforme</p>
                  <p className="font-semibold text-[#00D084]">${precioActual.toLocaleString()} COP</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.cedula}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#00D084] text-[#0D1117] rounded-lg font-semibold hover:bg-[#00D084]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando pedido...
                </>
              ) : (
                <>
                  <Shirt className="w-5 h-5" />
                  Guardar Pedido
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-8 bg-[#161B22] rounded-xl border border-[#30363D] p-6">
          <h3 className="font-semibold text-[#E6EDF3] mb-3">📋 ¿Cómo funciona?</h3>
          <ul className="space-y-2 text-sm text-[#8B949E]">
            <li>✅ Selecciona el jugador</li>
            <li>✅ Elige tipo, talla, número y nombre a estampar</li>
            <li>✅ Haz click "Guardar Pedido"</li>
            <li>✅ El pedido se registra en PEDIDOS_UNIFORMES</li>
            <li>✅ Exporta/imprime desde Google Sheets</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
