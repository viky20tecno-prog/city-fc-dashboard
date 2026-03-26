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

  useEffect(() => {
    cargarNumeros();
  }, []);

  const cargarNumeros = async () => {
    try {
      const res = await fetch(`${API_BASE}/uniforms/numeros?club_id=${CLUB_ID}`);
      const data = await res.json();
      if (data.success) setNumerosUsados(data.numeros);
    } catch (e) {
      console.error(e);
    }
  };

  const buscarJugador = async () => {
    if (!form.cedula) return;

    setBuscando(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/players/${form.cedula}?club_id=${CLUB_ID}`);
      const data = await res.json();

      if (data.success) {
        setJugadorEncontrado(data.player);
        setForm(f => ({ ...f, nombre: data.player.nombre_completo }));
        setStep(2);
      } else {
        setError('Jugador no encontrado');
      }

    } catch {
      setError('Error de conexión');
    } finally {
      setBuscando(false);
    }
  };

  const formatNumero = val => val.replace(/\D/g, '').slice(0, 3);

  const numeroPadded = form.numero ? form.numero.padStart(3, '0') : '';
  const numeroRepetido = numerosUsados.includes(numeroPadded);

  const handleSubmit = async () => {
    setError('');

    if (!form.tipo || !form.talla || !form.numero) {
      setError('Completá todos los campos obligatorios.');
      return;
    }

    if (numeroRepetido) {
      setError(`El número ${numeroPadded} ya está asignado`);
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch(`${API_BASE}/uniforms?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, numero: numeroPadded }),
      });

      const data = await res.json();

      if (data.success) {
        setExito(true);

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
        }, 2000);
      } else {
        setError('Error al registrar');
      }

    } catch {
      setError('Error de conexión');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-[#161B22] p-6 rounded-2xl border border-[#30363D]">

      <h2 className="text-white font-bold mb-4">
        Pedido de Uniforme
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* PASO 1 */}
      {step === 1 && (
        <>
          <input
            value={form.cedula}
            onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
            placeholder="Cédula"
            className="w-full mb-3 p-2 rounded bg-[#0D1117] border border-[#30363D] text-white"
          />

          <button
            onClick={buscarJugador}
            disabled={!form.cedula}
            className="w-full py-3 bg-green-500 rounded-xl font-bold disabled:opacity-40"
          >
            {buscando ? 'Buscando...' : 'Buscar jugador'}
          </button>
        </>
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <>
          <p className="text-white mb-2">{jugadorEncontrado?.nombre_completo}</p>

          <input
            value={form.numero}
            onChange={e => setForm(f => ({ ...f, numero: formatNumero(e.target.value) }))}
            placeholder="Número"
            className="w-full mb-2 p-2 rounded bg-[#0D1117] border border-[#30363D] text-white"
          />

          {form.numero && (
            <p className={`text-sm ${numeroRepetido ? 'text-red-400' : 'text-green-400'}`}>
              {numeroRepetido ? 'Número ya usado' : 'Número disponible'}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={numeroRepetido || enviando}
            className="w-full mt-3 py-3 bg-green-500 rounded-xl font-bold disabled:opacity-40"
          >
            {enviando ? 'Guardando...' : 'Registrar pedido'}
          </button>
        </>
      )}

    </div>
  );
}
