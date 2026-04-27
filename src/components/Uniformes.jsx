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
    prendas: [],
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
    setForm({ cedula: '', nombre: '', prendas: [], nombre_estampar: '', talla: '', numero: '' });
    setError('');
  };

  const togglePrenda = (prenda) => {
    setForm(f => {
      const existe = f.prendas.find(p => p.valor === prenda.valor);
      return {
        ...f,
        prendas: existe
          ? f.prendas.filter(p => p.valor !== prenda.valor)
          : [...f.prendas, prenda],
      };
    });
  };

  const total = form.prendas.reduce((sum, p) => sum + p.precio, 0);

  const formatNumero = (val) => val.replace(/\D/g, '').slice(0, 3);

  const numeroNormalizado = form.numero ? String(parseInt(form.numero, 10)) : '';
  const numeroDisplay = form.numero ? form.numero.padStart(3, '0') : '';
  const numeroRepetido = numeroNormalizado ? numerosUsados.includes(numeroNormalizado) : false;
  const numeroValido = form.numero && !numeroRepetido;

  const handleSubmit = async () => {
    setError('');
    const faltantes = [];
    if (form.prendas.length === 0) faltantes.push('prenda');
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
          tipo: 'Jugador',
          prendas: form.prendas.map(p => p.valor).join(', '),
          total,
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
        <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-6">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[rgba(249,115,22,0.12)] flex items-center justify-center">
              <Shirt className="w-5 h-5 text-[#F97316]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Pedido de Uniforme</h2>
              <p className="text-xs text-[#737373]">
                {step === 1 ? 'Paso 1 — Buscá el jugador por nombre o cédula' : 'Paso 2 — Datos del uniforme'}
              </p>
            </div>
          </div>

          {exito && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(249,115,22,0.12)] border border-[#F97316]/30 mb-6">
              <CheckCircle className="w-5 h-5 text-[#F97316]" />
              <p className="text-sm text-[#F97316] font-medium">¡Pedido registrado exitosamente!</p>
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
                <label className="block text-xs text-[#737373] mb-1.5">Buscar jugador *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={handleBusquedaChange}
                    onFocus={() => busqueda.trim().length >= 2 && setMostrarSugerencias(true)}
                    placeholder="Nombre, apellido o cédula..."
                    className="w-full bg-[#0C0C0C] border border-[#2A2A2A] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#F97316] transition-colors"
                  />
                  {busqueda && (
                    <button
                      onClick={limpiarBusqueda}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown de sugerencias */}
                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-xl overflow-hidden">
                    {sugerencias.map((j) => (
                      <button
                        key={j.cedula}
                        onClick={() => seleccionarJugador(j)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2D3748] transition-colors text-left border-b border-[#2A2A2A]/50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-[rgba(249,115,22,0.12)] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#F97316]">
                            {(j.nombre || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#F5F5F5]">{j.nombre} {j.apellidos}</p>
                          <p className="text-xs text-[#737373]">CC {j.cedula}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {mostrarSugerencias && sugerencias.length === 0 && busqueda.trim().length >= 2 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
                    <p className="text-sm text-[#737373]">No se encontró ningún jugador</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#737373]">Escribe al menos 2 caracteres para ver sugerencias</p>
            </div>
          )}

          {/* Paso 2: Datos del uniforme */}
          {step === 2 && jugadorEncontrado && (
            <div className="space-y-4">

              <div className="p-3 rounded-xl bg-[rgba(249,115,22,0.08)] border border-[#F97316]/20 flex items-center gap-3 mb-2">
                <CheckCircle className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#F5F5F5]">
                    {jugadorEncontrado.nombre} {jugadorEncontrado.apellidos}
                  </p>
                  <p className="text-xs text-[#737373]">CC {jugadorEncontrado.cedula}</p>
                </div>
                <button
                  onClick={limpiarBusqueda}
                  className="ml-auto text-xs text-[#737373] hover:text-[#F5F5F5] transition-colors"
                >
                  Cambiar
                </button>
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Prendas * <span className="font-normal">(podés seleccionar varias)</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {PRENDAS.map(p => {
                    const seleccionada = form.prendas.find(x => x.valor === p.valor);
                    return (
                      <button
                        key={p.valor}
                        onClick={() => togglePrenda(p)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                          seleccionada
                            ? 'bg-[rgba(249,115,22,0.12)] border-[#F97316]/50 text-[#F97316]'
                            : 'bg-[#0C0C0C] border-[#2A2A2A] text-[#737373] hover:text-[#F5F5F5]'
                        }`}
                      >
                        <span>{p.valor}</span>
                        <span className="font-mono text-xs">${p.precio.toLocaleString('es-CO')}</span>
                      </button>
                    );
                  })}
                </div>
                {form.prendas.length > 0 && (
                  <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[#F97316]/30">
                    <span className="text-xs text-[#737373]">{form.prendas.length} prenda{form.prendas.length > 1 ? 's' : ''} seleccionada{form.prendas.length > 1 ? 's' : ''}</span>
                    <span className="text-sm font-bold text-[#F97316]">Total: ${total.toLocaleString('es-CO')}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">
                  Nombre a estampar
                  <span className="ml-2 text-[#737373] font-normal italic">— puede ser apodo o sobrenombre</span>
                </label>
                <input
                  type="text"
                  value={form.nombre_estampar}
                  onChange={e => setForm(f => ({ ...f, nombre_estampar: e.target.value.toUpperCase() }))}
                  placeholder="Ej: CAÑÓN, TOÑO, EL DIEZ..."
                  className="w-full bg-[#0C0C0C] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Talla *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['S', 'M', 'L', 'XL'].map(t => (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, talla: t }))}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          form.talla === t
                            ? 'bg-[rgba(249,115,22,0.12)] border-[#F97316]/50 text-[#F97316]'
                            : 'bg-[#0C0C0C] border-[#2A2A2A] text-[#737373] hover:text-[#F5F5F5]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">
                    Número * <span className="text-[#737373] font-normal">(3 dígitos)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.numero}
                    onChange={e => setForm(f => ({ ...f, numero: formatNumero(e.target.value) }))}
                    placeholder="001"
                    maxLength={3}
                    className={`w-full bg-[#0C0C0C] border rounded-xl px-4 py-2.5 text-sm font-mono text-[#F5F5F5] placeholder-[#737373] focus:outline-none transition-colors ${
                      numeroRepetido
                        ? 'border-[#FF5E5E] focus:border-[#FF5E5E]'
                        : 'border-[#2A2A2A] focus:border-[#F97316]'
                    }`}
                  />
                  {form.numero && (
                    <p className={`text-xs mt-1 font-mono ${numeroValido ? 'text-[#F97316]' : 'text-[#FF5E5E]'}`}>
                      {numeroValido
                        ? `✓ #${numeroDisplay} disponible`
                        : `✗ #${numeroDisplay} ya asignado`}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={form.prendas.length === 0 || !form.talla || !form.numero || enviando || !numeroValido}
                className="w-full py-3 rounded-xl bg-[#F97316] text-[#0C0C0C] text-sm font-bold hover:bg-[#F97316]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Registrando...</>
                ) : (
                  'Registrar pedido'
                )}
              </button>
              <p className="text-xs text-[#737373] text-center">* Campos obligatorios</p>
            </div>
          )}
        </div>
      </div>

      {pedidos.length > 0 && (
        <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-6">
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-4">Pedidos registrados — {pedidos.length}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  {['Cédula', 'Nombre', 'Prendas', 'Estampar', 'Talla', 'Número', 'Total', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-[#737373] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p, i) => (
                  <tr key={i} className="border-b border-[#2A2A2A]/50 hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-2 px-3 text-[#737373]">{p.cedula}</td>
                    <td className="py-2 px-3 text-[#F5F5F5]">{p.nombre}</td>
                    <td className="py-2 px-3 text-[#F5F5F5]">{p.prendas || p.prenda || '—'}</td>
                    <td className="py-2 px-3 text-[#F5F5F5]">{p.nombre_estampar || '—'}</td>
                    <td className="py-2 px-3 text-[#F5F5F5]">{p.talla}</td>
                    <td className="py-2 px-3 text-[#F5F5F5] font-mono font-bold">{p.numero_estampar}</td>
                    <td className="py-2 px-3 text-[#F97316] font-semibold">
                      {p.total ? `$${Number(p.total).toLocaleString('es-CO')}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-[#737373] text-xs">{formatFecha(p.created_at)}</td>
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
