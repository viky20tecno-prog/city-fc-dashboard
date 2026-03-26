import { useState, useEffect } from 'react';
import { Shirt, CheckCircle, AlertCircle, Search, Loader, Trophy } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const CLUB_ID = import.meta.env.VITE_CLUB_ID || 'city-fc';

export default function Uniformes() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    tipo: '',
    campeon: false,
    nombre_estampar: '',
    talla: '',
    numero: '',
  });

  const [jugadorEncontrado, setJugadorEncontrado] = useState(null);
  const [numerosUsados, setNumerosUsados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    cargarNumerosYPedidos();
  }, []);

  const cargarNumerosYPedidos = async () => {
    try {
      const [numRes, pedRes] = await Promise.all([
        fetch(`${API_BASE}/uniforms/numeros?club_id=${CLUB_ID}`),
        fetch(`${API_BASE}/uniforms?club_id=${CLUB_ID}`),
      ]);

      const numData = await numRes.json();
      const pedData = await pedRes.json();

      if (numData.success) setNumerosUsados(numData.numeros);
      if (pedData.success) setPedidos(pedData.data);

    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  };

  const buscarJugador = async () => {
    if (!form.cedula) return;

    setBuscando(true);
    setError('');
    setJugadorEncontrado(null);

    try {
      const res = await fetch(`${API_BASE}/players/${form.cedula}?club_id=${CLUB_ID}`);
      const data = await res.json();

      if (data.success) {
        setJugadorEncontrado(data.player);
        setForm(f => ({ ...f, nombre: data.player.nombre_completo }));
        setStep(2);
      } else {
        setError('Jugador no encontrado. Verificá la cédula.');
      }

    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setBuscando(false);
    }
  };

  const formatNumero = (val) => val.replace(/\D/g, '').slice(0, 3);

  const numeroPadded = form.numero ? form.numero.padStart(3, '0') : '';
  const numeroRepetido = numeroPadded && numerosUsados.includes(numeroPadded);
  const numeroValido = form.numero && !numeroRepetido;

  const handleSubmit = async () => {
    setError('');

    if (!form.tipo || !form.talla || !form.numero) {
      setError('Completá todos los campos obligatorios.');
      return;
    }

    if (numeroRepetido) {
      setError(`El número ${numeroPadded} ya está asignado. Elegí otro.`);
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch(`${API_BASE}/uniforms?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          numero: numeroPadded,
          club_id: CLUB_ID,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setExito(true);
        await cargarNumerosYPedidos();

        setTimeout(() => {
          setExito(false);
          setStep(1);
          setForm({
            cedula: '',
            nombre: '',
            tipo: '',
            campeon: false,
            nombre_estampar: '',
            talla: '',
            numero: '',
          });
          setJugadorEncontrado(null);
        }, 3000);

      } else {
        setError(data.message || 'Error al registrar el pedido.');
      }

    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="max-w-xl mx-auto">
        <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6">

          <h2 className="text-lg font-bold text-[#E6EDF3] mb-4">
            Pedido de Uniforme
          </h2>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {/* INPUT NUMERO */}
          {step === 2 && (
            <div>
              <label className="text-xs text-[#8B949E]">Número *</label>

              <input
                type="text"
                value={form.numero}
                onChange={e => setForm(f => ({ ...f, numero: formatNumero(e.target.value) }))}
                className={`w-full mt-1 px-4 py-2 rounded-xl border ${
                  numeroRepetido ? 'border-red-500' : 'border-[#30363D]'
                } bg-[#0D1117] text-white`}
              />

              {form.numero && (
                <p className={`text-xs mt-1 ${numeroRepetido ? 'text-red-400' : 'text-green-400'}`}>
                  {numeroRepetido
                    ? `✗ El número ${numeroPadded} ya está en uso`
                    : `✓ Número disponible`}
                </p>
              )}
            </div>
          )}

          {/* BOTON */}
          <button
            onClick={handleSubmit}
            disabled={numeroRepetido || enviando}
            className={`w-full mt-4 py-3 rounded-xl font-bold ${
              numeroRepetido
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {enviando ? 'Guardando...' : 'Registrar pedido'}
          </button>

        </div>
      </div>
    </div>
  );
}
