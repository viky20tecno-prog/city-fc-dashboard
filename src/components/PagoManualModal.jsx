import { useState } from 'react';
import { X, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { APPS_SCRIPT_URL } from '../config';

const CONCEPTOS = ['Mensualidad', 'Uniforme', 'Torneo', 'Otro'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Consignación'];

export default function PagoManualModal({ jugadores, onClose, onSuccess }) {
  const [form, setForm] = useState({
    cedula: '',
    concepto: 'Mensualidad',
    monto: '',
    metodo_pago: 'Efectivo',
    referencia: '',
    observacion: '',
    torneo: '',
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const jugadoresFiltrados = busqueda.length >= 2
    ? jugadores.filter(j => {
        const nombre = `${j['nombre(s)'] || j.nombre || ''} ${j['apellido(s)'] || j.apellidos || ''}`.toLowerCase();
        return nombre.includes(busqueda.toLowerCase()) || (j.cedula || '').includes(busqueda);
      }).slice(0, 8)
    : [];

  const seleccionarJugador = (j) => {
    const nombre = `${j['nombre(s)'] || j.nombre || ''} ${j['apellido(s)'] || j.apellidos || ''}`.trim();
    setJugadorSeleccionado(j);
    setForm(prev => ({ ...prev, cedula: j.cedula }));
    setBusqueda(nombre);
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    if (!jugadorSeleccionado) {
      setStatus('error');
      setErrorMsg('Selecciona un jugador de la lista');
      return;
    }

    if (!form.monto || parseInt(form.monto) <= 0) {
      setStatus('error');
      setErrorMsg('Ingresa un monto válido');
      return;
    }

    try {
      const payload = {
        action: 'pago_manual',
        cedula: form.cedula,
        celular: jugadorSeleccionado.celular,
        nombre: `${jugadorSeleccionado['nombre(s)'] || jugadorSeleccionado.nombre || ''} ${jugadorSeleccionado['apellido(s)'] || jugadorSeleccionado.apellidos || ''}`.trim(),
        concepto: form.concepto,
        monto: parseInt(form.monto),
        metodo_pago: form.metodo_pago,
        referencia: form.referencia || 'MANUAL-' + Date.now(),
        observacion: form.observacion,
        torneo: form.torneo,
        fecha: new Date().toISOString().split('T')[0],
      };

      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      if (res.type === 'opaque' || res.ok) {
        setStatus('success');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        setStatus('error');
        setErrorMsg('Error al registrar el pago');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Error de conexión: ' + err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(0,208,132,0.12)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#00D084]" />
          </div>
          <h2 className="text-xl font-bold text-[#E6EDF3] mb-2">Pago registrado</h2>
          <p className="text-[#8B949E]">{form.concepto} · {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(form.monto)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#30363D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(0,208,132,0.12)] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#00D084]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6EDF3]">Registrar Pago Manual</h2>
              <p className="text-xs text-[#8B949E]">Pagos en efectivo, Nequi, transferencia, etc.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#1E2530] transition-colors">
            <X className="w-5 h-5 text-[#8B949E]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Buscar jugador */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Jugador <span className="text-[#FF5E5E]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setJugadorSeleccionado(null); }}
                className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
              />
              {jugadorSeleccionado && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00D084] text-xs font-medium">✓ Seleccionado</span>
              )}
            </div>
            {jugadoresFiltrados.length > 0 && !jugadorSeleccionado && (
              <div className="mt-1 bg-[#1E2530] border border-[#30363D] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {jugadoresFiltrados.map((j, i) => {
                  const nombre = `${j['nombre(s)'] || j.nombre || ''} ${j['apellido(s)'] || j.apellidos || ''}`.trim();
                  return (
                    <button
                      key={j.cedula || i}
                      type="button"
                      onClick={() => seleccionarJugador(j)}
                      className="w-full text-left px-4 py-2 hover:bg-[#161B22] transition-colors border-b border-[#30363D] last:border-0"
                    >
                      <p className="text-sm text-[#E6EDF3]">{nombre}</p>
                      <p className="text-xs text-[#8B949E]">CC {j.cedula} · {j.celular}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Concepto <span className="text-[#FF5E5E]">*</span>
            </label>
            <select
              value={form.concepto}
              onChange={e => handleChange('concepto', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
            >
              {CONCEPTOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Torneo (condicional) */}
          {form.concepto === 'Torneo' && (
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                Nombre del torneo <span className="text-[#FF5E5E]">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Copa Ciudad 2026"
                value={form.torneo}
                onChange={e => handleChange('torneo', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
              />
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Monto <span className="text-[#FF5E5E]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B949E] text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="65000"
                value={form.monto}
                onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); handleChange('monto', v); }}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
              />
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Método de pago <span className="text-[#FF5E5E]">*</span>
            </label>
            <select
              value={form.metodo_pago}
              onChange={e => handleChange('metodo_pago', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
            >
              {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Referencia — solo si NO es efectivo */}
          {form.metodo_pago !== 'Efectivo' && (
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                Referencia o número de recibo
              </label>
              <input
                type="text"
                placeholder="Ej: REC-001 (opcional)"
                value={form.referencia}
                onChange={e => handleChange('referencia', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]"
              />
            </div>
          )}

          {/* Observación */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Observación
            </label>
            <textarea
              placeholder="Notas adicionales (opcional)"
              value={form.observacion}
              onChange={e => handleChange('observacion', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084] resize-none"
            />
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-[rgba(255,94,94,0.12)] rounded-xl text-sm text-[#FF5E5E] border border-[#FF5E5E]/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00D084] text-[#0D1117] rounded-xl font-medium text-sm hover:bg-[#00D084]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Registrar Pago
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
