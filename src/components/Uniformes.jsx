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

  const formatNumero = (val) => {
    const num = val.replace(/\D/g, '').slice(0, 3);
    return num;
  };

  const numeroDisplay = form.numero ? form.numero.padStart(3, '0') : '';
  const numeroValido = form.numero && !numerosUsados.includes((form.numero || '').padStart(3, '0'));

  const handleSubmit = async () => {
    setError('');
    if (!form.tipo || !form.talla || !form.numero) {
      setError('Completá todos los campos obligatorios.');
      return;
    }
    const numeroPadded = form.numero.padStart(3, '0');
    if (numerosUsados.includes(numeroPadded)) {
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
          campeon: form.campeon,
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
          setForm({ cedula: '', nombre: '', tipo: '', campeon: false, nombre_estampar: '', talla: '', numero: '' });
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

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[rgba(0,208,132,0.12)] flex items-center justify-center">
              <Shirt className="w-5 h-5 text-[#00D084]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6EDF3]">Pedido de Uniforme</h2>
              <p className="text-xs text-[#8B949E]">
                {step === 1 ? 'Paso 1 — Identificate con tu cédula' : 'Paso 2 — Datos del uniforme'}
              </p>
            </div>
          </div>

          {exito && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(0,208,132,0.12)] border border-[#00D084]/30 mb-6">
              <CheckCircle className="w-5 h-5 text-[#00D084]" />
              <p className="text-sm text-[#00D084] font-medium">¡Pedido registrado exitosamente!</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/30 mb-6">
              <AlertCircle className="w-5 h-5 text-[#FF5E5E]" />
              <p className="text-sm text-[#FF5E5E]">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#8B949E] mb-1.5">Cédula *</label>
                <input
                  type="text"
                  value={form.cedula}
                  onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && buscarJugador()}
                  placeholder="Ingresá tu número de cédula"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#00D084] transition-colors"
                />
              </div>
              <button
                onClick={buscarJugador}
                disabled={!form.cedula || buscando}
                className="w-full py-3 rounded-xl bg-[#00D084] text-[#0D1117] text-sm font-bold hover:bg-[#00D084]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {buscando ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Buscando...</>
                ) : (
                  <><Search className="w-4 h-4" /> Buscar jugador</>
                )}
              </button>
            </div>
          )}

          {step === 2 && jugadorEncontrado && (
            <div className="space-y-4">

              <div className="p-3 rounded-xl bg-[rgba(0,208,132,0.08)] border border-[#00D084]/20 flex items-center gap-3 mb-2">
                <CheckCircle className="w-4 h-4 text-[#00D084] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#E6EDF3]">{jugadorEncontrado.nombre_completo}</p>
                  <p className="text-xs text-[#8B949E]">CC {jugadorEncontrado.cedula}</p>
                </div>
                <button
                  onClick={() => { setStep(1); setJugadorEncontrado(null); setError(''); }}
                  className="ml-auto text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
                >
                  Cambiar
                </button>
              </div>

              <div>
                <label className="block text-xs text-[#8B949E] mb-1.5">Tipo de jugador *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Jugador', 'Portero'].map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        form.tipo === t
                          ? 'bg-[rgba(0,208,132,0.12)] border-[#00D084]/50 text-[#00D084]'
                          : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    onClick={() => setForm(f => ({ ...f, campeon: !f.campeon }))}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      form.campeon
                        ? 'bg-[rgba(245,166,35,0.15)] border-[#F5A623]/50 text-[#F5A623]'
                        : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Campeón
                  </button>
                </div>
                {form.campeon && (
                  <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-[rgba(245,166,35,0.08)] border border-[#F5A623]/20">
                    <Trophy className="w-3.5 h-3.5 text-[#F5A623] flex-shrink-0" />
                    <p className="text-xs text-[#F5A623]">Descuento de campeón aplicado al precio del uniforme</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#8B949E] mb-1.5">
                  Nombre a estampar
                  <span className="ml-2 text-[#8B949E] font-normal italic">— puede ser apodo o sobrenombre</span>
                </label>
                <input
                  type="text"
                  value={form.nombre_estampar}
                  onChange={e => setForm(f => ({ ...f, nombre_estampar: e.target.value.toUpperCase() }))}
                  placeholder="Ej: CAÑÓN, TOÑO, EL DIEZ..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#00D084] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8B949E] mb-1.5">Talla *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['S', 'M', 'L', 'XL'].map(t => (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, talla: t }))}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          form.talla === t
                            ? 'bg-[rgba(0,208,132,0.12)] border-[#00D084]/50 text-[#00D084]'
                            : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#8B949E] mb-1.5">Número * <span className="text-[#8B949E] font-normal">(3 dígitos)</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.numero}
                    onChange={e => setForm(f => ({ ...f, numero: formatNumero(e.target.value) }))}
                    placeholder="001"
                    maxLength={3}
                    className={`w-full bg-[#0D1117] border rounded-xl px-4 py-2.5 text-sm font-mono text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none transition-colors ${
                      form.numero && numerosUsados.includes(form.numero.padStart(3, '0'))
                        ? 'border-[#FF5E5E] focus:border-[#FF5E5E]'
                        : 'border-[#30363D] focus:border-[#00D084]'
                    }`}
                  />
                  {form.numero && (
                    <p className={`text-xs mt-1 font-mono ${numeroValido ? 'text-[#00D084]' : 'text-[#FF5E5E]'}`}>
                      {numeroValido
                        ? `✓ #${numeroDisplay} disponible`
                        : `✗ #${numeroDisplay} ya asignado`}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.tipo || !form.talla || !form.numero || enviando || numerosUsados.includes((form.numero || '').padStart(3, '0'))}
                className="w-full py-3 rounded-xl bg-[#00D084] text-[#0D1117] text-sm font-bold hover:bg-[#00D084]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Registrando...</>
                ) : (
                  'Registrar pedido'
                )}
              </button>
              <p className="text-xs text-[#8B949E] text-center">* Campos obligatorios</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de pedidos */}
      {pedidos.length > 0 && (
        <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6">
          <h3 className="text-sm font-bold text-[#E6EDF3] mb-4">Pedidos registrados — {pedidos.length}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363D]">
                  {['Cédula', 'Nombre', 'Tipo', 'Campeón', 'Estampar', 'Talla', 'Número', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-[#8B949E] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p, i) => (
                  <tr key={i} className="border-b border-[#30363D]/50 hover:bg-[#1E2530] transition-colors">
                    <td className="py-2 px-3 text-[#8B949E]">{p.cedula}</td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.nombre}</td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.tipo}</td>
                    <td className="py-2 px-3">
                      {p.campeon === 'SI' || p.campeon === 'true' || p.campeon === true ? (
                        <span className="flex items-center gap-1 text-[#F5A623]">
                          <Trophy className="w-3 h-3" /> Sí
                        </span>
                      ) : (
                        <span className="text-[#8B949E]">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.nombre_estampar || '—'}</td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.talla}</td>
                    <td className="py-2 px-3 text-[#E6EDF3] font-mono font-bold">{p.numero}</td>
                    <td className="py-2 px-3 text-[#8B949E] text-xs">{p.fecha}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 rounded-lg text-xs bg-[rgba(245,166,35,0.12)] text-[#F5A623]">
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
