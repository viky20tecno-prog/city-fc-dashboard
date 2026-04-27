import { useState, useEffect, useRef } from 'react';
import { Shirt, CheckCircle, AlertCircle, Search, Loader, X } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

const PRENDAS = [
  { valor: 'Uniforme naranja',  precio: 120000 },
  { valor: 'Camiseta naranja',  precio: 75000  },
  { valor: 'Uniforme blanco',   precio: 110000 },
  { valor: 'Camiseta blanca',   precio: 65000  },
  { valor: 'Uniforme Portero',  precio: 120000 },
  { valor: 'Camiseta Portero',  precio: 75000  },
  { valor: 'Peto',              precio: 44000  },
  { valor: 'Pantaloneta',       precio: 45000  },
  { valor: 'Chaqueta',          precio: 170000 },
  { valor: 'Sudadera',          precio: 115000 },
  { valor: 'Medias',            precio: 15000  },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const CLUB_ID = 'city-fc';

export default function Uniformes() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    prenda: '',
    nombre_estampar: '',
    talla: '',
    numero: '',
  });
  const [jugadorEncontrado, setJugadorEncontrado] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [numerosUsados, setNumerosUsados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarDatos = async () => {
    try {
      const [playersRes, numRes, pedRes] = await Promise.all([
        authFetch(`${API_BASE}/players?club_id=${CLUB_ID}`),
        authFetch(`${API_BASE}/uniforms/numeros?club_id=${CLUB_ID}`),
        authFetch(`${API_BASE}/uniforms?club_id=${CLUB_ID}`),
      ]);
      const playersData = await playersRes.json();
      const numData = await numRes.json();
      const pedData = await pedRes.json();

      if (playersData.success) setJugadores(playersData.data || []);
      if (numData.success) {
        const normalizados = (numData.numeros || []).map(n => String(parseInt(n, 10)));
        setNumerosUsados(normalizados);
      }
      if (pedData.success) setPedidos(pedData.data || []);
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  };

  const handleBusquedaChange = (e) => {
    const val = e.target.value;
    setBusqueda(val);

    if (val.trim().length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const lower = val.toLowerCase();
    const filtered = jugadores.filter(j => {
      const nombreCompleto = `${j.nombre || ''} ${j.apellidos || ''}`.toLowerCase();
      const cedula = String(j.cedula || '').toLowerCase();
      return nombreCompleto.includes(lower) || cedula.includes(lower);
    }).slice(0, 6);

    setSugerencias(filtered);
    setMostrarSugerencias(true);
  };

  const seleccionarJugador = (jugador) => {
    const nombreCompleto = `${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim();
    setJugadorEncontrado(jugador);
    setForm(f => ({ ...f, cedula: jugador.cedula, nombre: nombreCompleto }));
    setBusqueda(nombreCompleto);
    setSugerencias([]);
    setMostrarSugerencias(false);
    setError('');
    setStep(2);
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setJugadorEncontrado(null);
    setStep(1);
    setForm({ cedula: '', nombre: '', prenda: '', nombre_estampar: '', talla: '', numero: '' });
    setError('');
  };

  const formatNumero = (val) => val.replace(/\D/g, '').slice(0, 3);

  const numeroNormalizado = form.numero ? String(parseInt(form.numero, 10)) : '';
  const numeroDisplay = form.numero ? form.numero.padStart(3, '0') : '';
  const numeroRepetido = numeroNormalizado ? numerosUsados.includes(numeroNormalizado) : false;
  const numeroValido = form.numero && !numeroRepetido;

  const handleSubmit = async () => {
    setError('');
    const faltantes = [];
    if (!form.prenda) faltantes.push('prenda');
    if (!form.talla) faltantes.push('talla');
    if (!form.numero) faltantes.push('número');
    if (faltantes.length > 0) {
      setError(`Faltá completar: ${faltantes.join(', ')}.`);
      return;
    }
    if (numeroRepetido) {
      setError(`El número ${numeroDisplay} ya está asignado. Elegí otro.`);
      return;
    }
    const numeroPadded = form.numero.padStart(3, '0');
    setEnviando(true);
    try {
      const res = await authFetch(`${API_BASE}/uniforms?club_id=${CLUB_ID}`, {
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
        await cargarDatos();
        setTimeout(() => {
          setExito(false);
          limpiarBusqueda();
        }, 3000);
      } else {
        setError(data.error || data.message || 'Error al registrar el pedido.');
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const formatFecha = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
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
                {step === 1 ? 'Paso 1 — Buscá el jugador por nombre o cédula' : 'Paso 2 — Datos del uniforme'}
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

          {/* Paso 1: Buscador */}
          {step === 1 && (
            <div className="space-y-4">
              <div ref={searchRef} className="relative">
                <label className="block text-xs text-[#8B949E] mb-1.5">Buscar jugador *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={handleBusquedaChange}
                    onFocus={() => busqueda.trim().length >= 2 && setMostrarSugerencias(true)}
                    placeholder="Nombre, apellido o cédula..."
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#00D084] transition-colors"
                  />
                  {busqueda && (
                    <button
                      onClick={limpiarBusqueda}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown de sugerencias */}
                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1E2530] border border-[#30363D] rounded-xl shadow-xl overflow-hidden">
                    {sugerencias.map((j) => (
                      <button
                        key={j.cedula}
                        onClick={() => seleccionarJugador(j)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2D3748] transition-colors text-left border-b border-[#30363D]/50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-[rgba(0,208,132,0.12)] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#00D084]">
                            {(j.nombre || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#E6EDF3]">{j.nombre} {j.apellidos}</p>
                          <p className="text-xs text-[#8B949E]">CC {j.cedula}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {mostrarSugerencias && sugerencias.length === 0 && busqueda.trim().length >= 2 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1E2530] border border-[#30363D] rounded-xl px-4 py-3">
                    <p className="text-sm text-[#8B949E]">No se encontró ningún jugador</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#8B949E]">Escribe al menos 2 caracteres para ver sugerencias</p>
            </div>
          )}

          {/* Paso 2: Datos del uniforme */}
          {step === 2 && jugadorEncontrado && (
            <div className="space-y-4">

              <div className="p-3 rounded-xl bg-[rgba(0,208,132,0.08)] border border-[#00D084]/20 flex items-center gap-3 mb-2">
                <CheckCircle className="w-4 h-4 text-[#00D084] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#E6EDF3]">
                    {jugadorEncontrado.nombre} {jugadorEncontrado.apellidos}
                  </p>
                  <p className="text-xs text-[#8B949E]">CC {jugadorEncontrado.cedula}</p>
                </div>
                <button
                  onClick={limpiarBusqueda}
                  className="ml-auto text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
                >
                  Cambiar
                </button>
              </div>

              <div>
                <label className="block text-xs text-[#8B949E] mb-1.5">Prenda *</label>
                <div className="grid grid-cols-1 gap-2">
                  {PRENDAS.map(p => (
                    <button
                      key={p.valor}
                      onClick={() => setForm(f => ({ ...f, prenda: p.valor }))}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        form.prenda === p.valor
                          ? 'bg-[rgba(0,208,132,0.12)] border-[#00D084]/50 text-[#00D084]'
                          : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                      }`}
                    >
                      <span>{p.valor}</span>
                      <span className="font-mono text-xs">${p.precio.toLocaleString('es-CO')}</span>
                    </button>
                  ))}
                </div>
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
                  <label className="block text-xs text-[#8B949E] mb-1.5">
                    Número * <span className="text-[#8B949E] font-normal">(3 dígitos)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.numero}
                    onChange={e => setForm(f => ({ ...f, numero: formatNumero(e.target.value) }))}
                    placeholder="001"
                    maxLength={3}
                    className={`w-full bg-[#0D1117] border rounded-xl px-4 py-2.5 text-sm font-mono text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none transition-colors ${
                      numeroRepetido
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
                disabled={!form.prenda || !form.talla || !form.numero || enviando || !numeroValido}
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

      {pedidos.length > 0 && (
        <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6">
          <h3 className="text-sm font-bold text-[#E6EDF3] mb-4">Pedidos registrados — {pedidos.length}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363D]">
                  {['Cédula', 'Nombre', 'Prenda', 'Estampar', 'Talla', 'Número', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-[#8B949E] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p, i) => (
                  <tr key={i} className="border-b border-[#30363D]/50 hover:bg-[#1E2530] transition-colors">
                    <td className="py-2 px-3 text-[#8B949E]">{p.cedula}</td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.nombre}</td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.prenda || '—'}</td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.nombre_estampar || '—'}</td>
                    <td className="py-2 px-3 text-[#E6EDF3]">{p.talla}</td>
                    <td className="py-2 px-3 text-[#E6EDF3] font-mono font-bold">{p.numero_estampar}</td>
                    <td className="py-2 px-3 text-[#8B949E] text-xs">{formatFecha(p.created_at)}</td>
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
