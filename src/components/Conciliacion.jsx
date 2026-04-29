import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Pencil, ExternalLink, RefreshCw, Clock, AlertCircle, CheckCheck, Wallet } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';

const CONCEPTOS = ['mensualidad', 'uniforme', 'torneo', 'otro'];
const BANCOS    = ['Bancolombia', 'Nequi', 'Daviplata', 'Davivienda', 'BBVA', 'Scotiabank', 'Efectivo', 'No especificado', 'Otro'];

const ESTADOS = [
  { id: 'pendiente',           label: 'Pendiente',    color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  { id: 'excedente_pendiente', label: 'Saldo a Favor',color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { id: 'aprobado_manual',     label: 'Aprobados',    color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20'  },
  { id: 'rechazado',           label: 'Rechazados',   color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20'      },
];

const CONCEPTO_COLORS = {
  mensualidad: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  uniforme:    'bg-purple-500/15 text-purple-300 border-purple-500/20',
  torneo:      'bg-orange-500/15 text-orange-300 border-orange-500/20',
  otro:        'bg-gray-500/15 text-gray-300 border-gray-500/20',
};

function formatMoney(v) {
  return `$${Number(v || 0).toLocaleString('es-CO')}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Miniatura de comprobante con lightbox ───────────────────────────────────
function ImagenComprobante({ url }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!url) return <span className="text-gray-600 text-xs">Sin imagen</span>;

  if (imgError) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 text-[#00AAFF] text-xs hover:underline">
        <ExternalLink className="w-3 h-3" /> Ver
      </a>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="block group">
        <img
          src={url}
          alt="Comprobante"
          onError={() => setImgError(true)}
          className="h-10 w-16 object-cover rounded-lg border border-[#1A3A5C] group-hover:border-[#00AAFF]/50 transition cursor-pointer"
        />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <img
            src={url}
            alt="Comprobante"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─── Modal de edición ────────────────────────────────────────────────────────
function EditModal({ pago, onClose, onSaved }) {
  const [form, setForm] = useState({
    monto:     pago.monto,
    banco:     pago.banco || '',
    referencia: pago.referencia || '',
    concepto:  pago.concepto || 'mensualidad',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await authFetch(`${API_BASE}/payments/${pago.id}?club_id=${getClubId()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al guardar');
      onSaved(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1A3A5C]">
          <h3 className="text-white font-semibold">Editar pago</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Jugador (solo lectura) */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Jugador</label>
            <p className="text-white text-sm">
              {pago.players ? `${pago.players.nombre} ${pago.players.apellidos}` : '—'}
              <span className="text-gray-500 ml-2 text-xs">{pago.cedula}</span>
            </p>
          </div>

          {/* Concepto */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Concepto</label>
            <select
              value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className="w-full bg-[#060C18] border border-[#1A3A5C] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00AAFF]/50"
            >
              {CONCEPTOS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Monto</label>
            <input
              type="number"
              value={form.monto}
              onChange={e => setForm(f => ({ ...f, monto: parseInt(e.target.value) || 0 }))}
              className="w-full bg-[#060C18] border border-[#1A3A5C] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00AAFF]/50"
            />
          </div>

          {/* Banco */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Banco</label>
            <input
              list="bancos-list"
              value={form.banco}
              onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}
              className="w-full bg-[#060C18] border border-[#1A3A5C] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00AAFF]/50"
              placeholder="Bancolombia, Nequi..."
            />
            <datalist id="bancos-list">
              {BANCOS.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>

          {/* Referencia */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Referencia / N° transacción</label>
            <input
              type="text"
              value={form.referencia}
              onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
              className="w-full bg-[#060C18] border border-[#1A3A5C] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00AAFF]/50"
              placeholder="123456789"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="flex gap-3 p-5 border-t border-[#1A3A5C]">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-[#1A3A5C] text-gray-400 text-sm hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-[#00AAFF]/10 border border-[#00AAFF]/30 text-[#00AAFF] text-sm font-medium hover:bg-[#00AAFF]/20 transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de la tabla ────────────────────────────────────────────────────────
function PagoRow({ pago, onEdit, onAction, actionLoading }) {
  const jugador = pago.players
    ? `${pago.players.nombre} ${pago.players.apellidos}`
    : pago.cedula;

  const isPendiente = pago.estado_revision === 'pendiente' || pago.estado_revision === 'excedente_pendiente';

  return (
    <tr className="border-b border-[#1A3A5C]/40 hover:bg-white/[0.02] transition-colors">
      {/* Fecha */}
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(pago.created_at)}</td>

      {/* Jugador */}
      <td className="px-4 py-3">
        <p className="text-white text-sm font-medium">{jugador}</p>
        <p className="text-gray-500 text-xs">{pago.cedula}</p>
      </td>

      {/* Concepto */}
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-xs font-medium ${CONCEPTO_COLORS[pago.concepto] || CONCEPTO_COLORS.otro}`}>
          {pago.concepto}
        </span>
      </td>

      {/* Monto */}
      <td className="px-4 py-3 text-white text-sm font-semibold whitespace-nowrap">{formatMoney(pago.monto)}</td>

      {/* Banco */}
      <td className="px-4 py-3 text-gray-300 text-sm">{pago.banco || '—'}</td>

      {/* Referencia */}
      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{pago.referencia || '—'}</td>

      {/* Comprobante */}
      <td className="px-4 py-3">
        <ImagenComprobante url={pago.url_comprobante} />
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        {isPendiente ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(pago)}
              title="Editar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAction(pago.id, 'aprobar')}
              disabled={actionLoading === pago.id}
              title="Aprobar"
              className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAction(pago.id, 'rechazar')}
              disabled={actionLoading === pago.id}
              title="Rechazar"
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition disabled:opacity-40"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className={`text-xs ${pago.estado_revision === 'aprobado_manual' ? 'text-green-400' : 'text-red-400'}`}>
            {pago.estado_revision === 'aprobado_manual' ? 'Aplicado' : 'Rechazado'}
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Conciliacion() {
  const [pagos, setPagos]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filtroEstado, setFiltro]   = useState('pendiente');
  const [editando, setEditando]     = useState(null);
  const [actionLoading, setActionL] = useState(null);
  const [toast, setToast]           = useState(null);

  const clubId = getClubId();

  const cargarPagos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await authFetch(`${API_BASE}/payments?club_id=${clubId}&estado=${filtroEstado}&limit=200`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPagos(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, clubId]);

  useEffect(() => { cargarPagos(); }, [cargarPagos]);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = async (pagoId, accion) => {
    setActionL(pagoId);
    try {
      const res = await authFetch(`${API_BASE}/payments/${pagoId}?club_id=${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast(accion === 'aprobar' ? 'Pago aprobado y registrado ✓' : 'Pago rechazado', accion === 'aprobar' ? 'ok' : 'error');
      await cargarPagos();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionL(null);
    }
  };

  const handleSaved = async () => {
    setEditando(null);
    showToast('Cambios guardados ✓');
    await cargarPagos();
  };

  const pendienteCount = (filtroEstado === 'pendiente' || filtroEstado === 'excedente_pendiente') ? pagos.length : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Conciliación de Pagos</h2>
          <p className="text-gray-400 text-sm mt-1">
            Valida cada comprobante con el banco antes de aprobar
          </p>
        </div>
        <button
          onClick={cargarPagos}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1A3A5C] text-gray-400 hover:text-white text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2">
        {ESTADOS.map(e => (
          <button
            key={e.id}
            onClick={() => setFiltro(e.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${
              filtroEstado === e.id
                ? `${e.bg} ${e.color} shadow-[0_0_15px_rgba(0,170,255,0.1)]`
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {e.id === 'pendiente'           && <Clock className="w-4 h-4" />}
            {e.id === 'excedente_pendiente' && <Wallet className="w-4 h-4" />}
            {e.id === 'aprobado_manual'     && <CheckCheck className="w-4 h-4" />}
            {e.id === 'rechazado'           && <XCircle className="w-4 h-4" />}
            {e.label}
            {e.id === 'pendiente' && pendienteCount != null && pendienteCount > 0 && (
              <span className="bg-yellow-400/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {pendienteCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-2xl overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-4 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-[#00AAFF] animate-spin" />
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay pagos en este estado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A3A5C] text-left">
                  {['Fecha', 'Jugador', 'Concepto', 'Monto', 'Banco', 'Referencia', 'Comprobante', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagos.map(p => (
                  <PagoRow
                    key={p.id}
                    pago={p}
                    onEdit={setEditando}
                    onAction={handleAction}
                    actionLoading={actionLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer con total */}
        {pagos.length > 0 && (
          <div className="px-4 py-3 border-t border-[#1A3A5C]/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">{pagos.length} registros</span>
            <span className="text-sm font-semibold text-white">
              Total: {formatMoney(pagos.reduce((s, p) => s + Number(p.monto || 0), 0))}
            </span>
          </div>
        )}
      </div>

      {/* Modal edición */}
      {editando && (
        <EditModal pago={editando} onClose={() => setEditando(null)} onSaved={handleSaved} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'ok'
            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
