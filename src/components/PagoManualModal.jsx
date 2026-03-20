import { useState } from 'react';
import { X, DollarSign, Loader2, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { API_BASE_URL } from '../config';

const CLUB_ID = import.meta.env.VITE_CLUB_ID || 'city-fc';

const CONCEPTOS = ['Mensualidad', 'Uniforme', 'Torneo', 'Otro'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Consignación'];

const UNIFORMES = [
  { label: 'Campeones General', valor: 90000 },
  { label: 'Campeones Solo EVG/SAB', valor: 60000 },
  { label: 'Arqueros Campeones EVG/SAB', valor: 120000 },
  { label: 'Arqueros General', valor: 160000 },
];

const TORNEOS = [
  { label: 'Punto y Coma', valor: 80000 },
  { label: 'JBC (Fútbol 7)', valor: 50000 },
  { label: 'INDESA 2026 I', valor: 120000 },
  { label: 'INDER Envigado', valor: 100000 },
];

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseInt(n) || 0);

export default function PagoManualModal({ jugadores, onClose, onSuccess }) {
  const [form, setForm] = useState({
    cedula: '',
    concepto: 'Mensualidad',
    monto: '65000',
    metodo_pago: 'Efectivo',
    referencia: '',
    observacion: '',
    torneo: '',
    uniforme: '',
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

  const nombreJugador = jugadorSeleccionado
    ? `${jugadorSeleccionado['nombre(s)'] || jugadorSeleccionado.nombre || ''} ${jugadorSeleccionado['apellido(s)'] || jugadorSeleccionado.apellidos || ''}`.trim()
    : '';

  const handleRevisar = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setStatus('idle');

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
    if (form.concepto === 'Torneo' && !form.torneo.trim()) {
      setStatus('error');
      setErrorMsg('Selecciona un torneo');
      return;
    }
    if (form.concepto === 'Uniforme' && !form.uniforme.trim()) {
      setStatus('error');
      setErrorMsg('Selecciona un tipo de uniforme');
      return;
    }

    setStatus('confirmar');
  };

  const handleConfirmar = async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      // ✅ Mapear concepto al formato que espera payments.js
      const conceptoLabel = form.concepto === 'Torneo'
        ? form.torneo
        : form.concepto === 'Uniforme'
        ? form.uniforme
        : form.concepto;

      const conceptos = [{
        tipo: form.concepto.toLowerCase(),
        descripcion: conceptoLabel,
        valor: parseInt(form.monto),
      }];

      const payload = {
        cedula: form.cedula,
        nombre_detectado: nombreJugador,
        monto: parseInt(form.monto),
        fecha_comprobante: new Date().toISOString().split('T')[0],
        banco: form.metodo_pago, // ✅ payments.js usa "banco" para método de pago
        referencia: form.referencia || (form.metodo_pago === 'Efectivo'
          ? `EFECTIVO-${Date.now()}`
          : `MANUAL-${Date.now()}`),
        conceptos,
        observacion: form.observacion,
        url_comprobante: '',
      };

      const res = await fetch(`${API_BASE_URL}/payments?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2500);
      } else {
        setStatus('error');
        setErrorMsg(data.error || data.message || 'Error al registrar el pago');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Error de conexión: ' + err.message);
    }
  };

  // ==================== PANTALLA ÉXITO ====================
  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(0,208,132,0.12)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#00D084]" />
          </div>
          <h2 className="text-xl font-bold text-[#E6EDF3] mb-2">¡Pago registrado!</h2>
          <p className="text-[#8B949E]">{nombreJugador}</p>
          <p className="text-[#E6EDF3] font-medium mt-1">{form.concepto} · {formatCOP(form.monto)}</p>
          <p className="text-xs text-[#8B949E] mt-3">El dashboard se actualizará automáticamente</p>
        </div>
      </div>
    );
  }

  // ==================== PANTALLA CONFIRMACIÓN ====================
  if (status === 'confirmar' || status === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-md">
          <div className="flex items-center gap-3 p-6 border-b border-[#30363D]">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.12)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E6EDF3]">Confirmar pago</h2>
              <p className="text-xs text-[#8B949E]">Revisa los datos antes de registrar</p>
            </div>
          </div>

          <div className="p-6 space-y-3">
            <div className="bg-[#1E2530] rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#8B949E]">Jugador</span>
                <span className="text-sm font-medium text-[#E6EDF3]">{nombreJugador}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#8B949E]">Cédula</span>
                <span className="text-sm font-mono text-[#E6EDF3]">{form.cedula}</span>
              </div>
              <div className="border-t border-[#30363D] my-2"></div>
              <div className="flex justify-between">
                <span className="text-sm text-[#8B949E]">Concepto</span>
                <span className="text-sm font-medium text-[#E6EDF3]">
                  {form.concepto}{form.torneo ? ` — ${form.torneo}` : ''}{form.uniforme ? ` — ${form.uniforme}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#8B949E]">Monto</span>
                <span className="text-lg font-bold text-[#00D084]">{formatCOP(form.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#8B949E]">Método</span>
                <span className="text-sm text-[#E6EDF3]">{form.metodo_pago}</span>
              </div>
              {form.referencia && form.metodo_pago !== 'Efectivo' && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#8B949E]">Referencia</span>
                  <span className="text-sm font-mono text-[#E6EDF3]">{form.referencia}</span>
                </div>
              )}
              {form.observacion && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#8B949E]">Observación</span>
                  <span className="text-sm text-[#E6EDF3] text-right max-w-[200px]">{form.observacion}</span>
                </div>
              )}
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-[rgba(255,94,94,0.12)] rounded-xl text-sm text-[#FF5E5E] border border-[#FF5E5E]/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={() => setStatus('idle')}
              disabled={status === 'loading'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#30363D] text-sm font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#8B949E] transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={status === 'loading'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#00D084] text-[#0D1117] rounded-xl font-medium text-sm hover:bg-[#00D084]/80 transition-all disabled:opacity-50"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Registrando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" />Confirmar Pago</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== FORMULARIO ====================
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-lg my-8">
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

        <form onSubmit={handleRevisar} className="p-6 space-y-4">
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
                    <button key={j.cedula || i} type="button" onClick={() => seleccionarJugador(j)}
                      className="w-full text-left px-4 py-2 hover:bg-[#161B22] transition-colors border-b border-[#30363D] last:border-0">
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
            <select value={form.concepto}
              onChange={e => {
                handleChange('concepto', e.target.value);
                if (e.target.value === 'Mensualidad') handleChange('monto', '65000');
                else if (e.target.value === 'Otro') handleChange('monto', '');
                handleChange('torneo', '');
                handleChange('uniforme', '');
              }}
              className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]">
              {CONCEPTOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Torneo */}
          {form.concepto === 'Torneo' && (
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                Torneo <span className="text-[#FF5E5E]">*</span>
              </label>
              <select value={form.torneo}
                onChange={e => {
                  const t = TORNEOS.find(t => t.label === e.target.value);
                  handleChange('torneo', e.target.value);
                  if (t) handleChange('monto', t.valor.toString());
                }}
                className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]">
                <option value="">Seleccionar torneo...</option>
                {TORNEOS.map(t => <option key={t.label} value={t.label}>{t.label} — {formatCOP(t.valor)}</option>)}
              </select>
            </div>
          )}

          {/* Uniforme */}
          {form.concepto === 'Uniforme' && (
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                Tipo de uniforme <span className="text-[#FF5E5E]">*</span>
              </label>
              <select value={form.uniforme}
                onChange={e => {
                  const u = UNIFORMES.find(u => u.label === e.target.value);
                  handleChange('uniforme', e.target.value);
                  if (u) handleChange('monto', u.valor.toString());
                }}
                className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]">
                <option value="">Seleccionar uniforme...</option>
                {UNIFORMES.map(u => <option key={u.label} value={u.label}>{u.label} — {formatCOP(u.valor)}</option>)}
              </select>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Monto <span className="text-[#FF5E5E]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B949E] text-sm">$</span>
              <input type="text" inputMode="numeric" placeholder="65000" value={form.monto}
                onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); handleChange('monto', v); }}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]" />
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Método de pago <span className="text-[#FF5E5E]">*</span>
            </label>
            <select value={form.metodo_pago} onChange={e => handleChange('metodo_pago', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]">
              {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Referencia */}
          {form.metodo_pago !== 'Efectivo' && (
            <div>
              <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                Referencia o número de recibo
              </label>
              <input type="text" placeholder="Ej: REC-001 (opcional)" value={form.referencia}
                onChange={e => handleChange('referencia', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084]" />
            </div>
          )}

          {/* Observación */}
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">Observación</label>
            <textarea placeholder="Notas adicionales (opcional)" value={form.observacion}
              onChange={e => handleChange('observacion', e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl bg-[#1E2530] border border-[#30363D] text-sm text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30 focus:border-[#00D084] resize-none" />
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-[rgba(255,94,94,0.12)] rounded-xl text-sm text-[#FF5E5E] border border-[#FF5E5E]/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          <button type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00D084] text-[#0D1117] rounded-xl font-medium text-sm hover:bg-[#00D084]/80 transition-all">
            <Shield className="w-4 h-4" />
            Revisar y Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}
