import { useState, useEffect } from 'react';
import { X, AlertTriangle, Plane, Clock, HelpCircle, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const CLUB_ID = 'city-fc';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const MOTIVOS = [
  { valor: 'LESION',           label: 'Lesión',           icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-400/10    border-red-400/30'    },
  { valor: 'VIAJE',            label: 'Viaje',             icon: Plane,         color: 'text-blue-400',   bg: 'bg-blue-400/10   border-blue-400/30'   },
  { valor: 'RETIRO_TEMPORAL',  label: 'Retiro temporal',   icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  { valor: 'OTRO',             label: 'Otro',              icon: HelpCircle,    color: 'text-gray-400',   bg: 'bg-gray-400/10   border-gray-400/30'   },
];

const mesActual = new Date().getMonth() + 1;
const anioActual = new Date().getFullYear();

export default function SuspensionModal({ jugador, onClose, onSuccess }) {
  const [suspensiones, setSuspensiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [cancelando, setCancelando] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [form, setForm] = useState({
    motivo: '',
    detalle: '',
    mes_inicio: mesActual,
    mes_fin: mesActual,
    anio: anioActual,
  });

  useEffect(() => {
    cargarSuspensiones();
  }, []);

  const cargarSuspensiones = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/suspensiones?club_id=${CLUB_ID}&cedula=${jugador.cedula}`);
      const data = await res.json();
      if (data.success) setSuspensiones(data.data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.motivo) {
      setMensaje({ tipo: 'error', texto: 'Seleccioná un motivo' });
      return;
    }
    setEnviando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const res = await authFetch(`${API_BASE}/suspensiones?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cedula: jugador.cedula }),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje({ tipo: 'ok', texto: data.message });
        setForm({ motivo: '', detalle: '', mes_inicio: mesActual, mes_fin: mesActual, anio: anioActual });
        await cargarSuspensiones();
        onSuccess?.();
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error registrando suspensión' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = async (id) => {
    setCancelando(id);
    try {
      const res = await authFetch(`${API_BASE}/suspensiones/${id}?club_id=${CLUB_ID}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await cargarSuspensiones();
        onSuccess?.();
      }
    } catch {
      // silencioso
    } finally {
      setCancelando(null);
    }
  };

  const suspensionesActivas   = suspensiones.filter(s => s.activa);
  const suspensionesHistorico = suspensiones.filter(s => !s.activa);

  return (
    <div className="fixed inset-0 bg-[#060C18]/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#30363D]">
          <div>
            <h2 className="text-lg font-bold text-[#E6EDF3]">Gestión de Suspensión</h2>
            <p className="text-sm text-[#8B949E]">{jugador.nombreCompleto} · CC {jugador.cedula}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Suspensiones activas */}
          {suspensionesActivas.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-3">Suspensiones activas</h3>
              <div className="space-y-2">
                {suspensionesActivas.map(s => {
                  const motivo = MOTIVOS.find(m => m.valor === s.motivo);
                  const Icon = motivo?.icon || HelpCircle;
                  const mesesTexto = s.mes_inicio === s.mes_fin
                    ? MESES[s.mes_inicio - 1]
                    : `${MESES[s.mes_inicio - 1]} – ${MESES[s.mes_fin - 1]}`;
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#060C18] border border-[#30363D]">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${motivo?.color || 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#E6EDF3]">{motivo?.label || s.motivo}</p>
                        <p className="text-xs text-[#8B949E]">{mesesTexto} {s.anio}{s.detalle ? ` · ${s.detalle}` : ''}</p>
                      </div>
                      <button
                        onClick={() => handleCancelar(s.id)}
                        disabled={cancelando === s.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#8B949E] hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Anular (solo si fue un error — los meses quedan suspendidos)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulario nueva suspensión */}
          <div>
            <h3 className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-3">Nueva suspensión</h3>

            {mensaje.texto && (
              <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${
                mensaje.tipo === 'ok'
                  ? 'bg-[rgba(0,208,132,0.12)] border border-[#00D084]/30 text-[#00D084]'
                  : 'bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/30 text-[#FF5E5E]'
              }`}>
                {mensaje.tipo === 'ok'
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {mensaje.texto}
              </div>
            )}

            {/* Motivo */}
            <div className="mb-4">
              <label className="block text-xs text-[#8B949E] mb-2">Motivo *</label>
              <div className="grid grid-cols-2 gap-2">
                {MOTIVOS.map(m => {
                  const Icon = m.icon;
                  const seleccionado = form.motivo === m.valor;
                  return (
                    <button
                      key={m.valor}
                      onClick={() => setForm(f => ({ ...f, motivo: m.valor }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        seleccionado ? m.bg + ' ' + m.color : 'bg-[#060C18] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Período */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-[#8B949E] mb-1.5">Mes inicio *</label>
                <select
                  value={form.mes_inicio}
                  onChange={e => setForm(f => ({ ...f, mes_inicio: parseInt(e.target.value) }))}
                  className="w-full bg-[#060C18] border border-[#30363D] rounded-xl px-3 py-2 text-sm text-[#E6EDF3] focus:outline-none focus:border-[#00D084]"
                >
                  {MESES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#8B949E] mb-1.5">Mes fin *</label>
                <select
                  value={form.mes_fin}
                  onChange={e => setForm(f => ({ ...f, mes_fin: parseInt(e.target.value) }))}
                  className="w-full bg-[#060C18] border border-[#30363D] rounded-xl px-3 py-2 text-sm text-[#E6EDF3] focus:outline-none focus:border-[#00D084]"
                >
                  {MESES.map((m, i) => (
                    <option key={i} value={i + 1} disabled={i + 1 < form.mes_inicio}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#8B949E] mb-1.5">Año</label>
                <input
                  type="number"
                  value={form.anio}
                  onChange={e => setForm(f => ({ ...f, anio: parseInt(e.target.value) }))}
                  className="w-full bg-[#060C18] border border-[#30363D] rounded-xl px-3 py-2 text-sm text-[#E6EDF3] focus:outline-none focus:border-[#00D084]"
                />
              </div>
            </div>

            {/* Detalle opcional */}
            <div className="mb-4">
              <label className="block text-xs text-[#8B949E] mb-1.5">Detalle <span className="font-normal italic">— opcional</span></label>
              <input
                type="text"
                value={form.detalle}
                onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))}
                placeholder="Ej: Fractura tobillo derecho, cirugía prevista..."
                className="w-full bg-[#060C18] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#00D084] transition-colors"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={enviando || !form.motivo}
              className="w-full py-3 rounded-xl bg-[#00D084] text-[#060C18] text-sm font-bold hover:bg-[#00D084]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? 'Registrando...' : 'Registrar suspensión'}
            </button>
          </div>

          {/* Historial */}
          {suspensionesHistorico.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">Anuladas por error</h3>
              <p className="text-xs text-[#8B949E] mb-3">Los meses siguen como suspendidos en el estado de cuenta.</p>
              <div className="space-y-2">
                {suspensionesHistorico.map(s => {
                  const motivo = MOTIVOS.find(m => m.valor === s.motivo);
                  const mesesTexto = s.mes_inicio === s.mes_fin
                    ? MESES[s.mes_inicio - 1]
                    : `${MESES[s.mes_inicio - 1]} – ${MESES[s.mes_fin - 1]}`;
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#060C18] border border-[#30363D]/50 opacity-60">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#8B949E]">{motivo?.label || s.motivo} · {mesesTexto} {s.anio}</p>
                        {s.detalle && <p className="text-xs text-[#8B949E]">{s.detalle}</p>}
                      </div>
                      <span className="text-xs text-[#8B949E] flex-shrink-0 italic">Anulada</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && suspensiones.length === 0 && (
            <p className="text-sm text-[#8B949E] text-center py-2">Sin suspensiones registradas</p>
          )}
        </div>
      </div>
    </div>
  );
}
