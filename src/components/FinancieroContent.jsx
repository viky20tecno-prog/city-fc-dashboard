import { useState, useEffect } from 'react';
import {
  Calendar, Shirt, Trophy, FileText, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, EyeOff, Loader2, PauseCircle, Package,
  MessageCircle, Wallet, Pencil,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { formatMoney, getCodigoPais } from '../lib/formatMoney';

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(parseFloat(n) || 0);

const ESTADO_ICON = {
  AL_DIA:    { icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-400/10 border border-green-400/20'   },
  PENDIENTE: { icon: Clock,         color: 'text-[#F59E0B]',  bg: 'bg-yellow-500/10 border border-yellow-500/20' },
  PARCIAL:   { icon: AlertTriangle, color: 'text-[var(--cc)]',  bg: 'bg-[var(--cc)]/10 border border-[var(--cc)]/20'   },
  MORA:      { icon: XCircle,       color: 'text-[#EF4444]',  bg: 'bg-red-500/10 border border-red-500/20'       },
};

const ESTADO_PEDIDO = {
  PENDIENTE: { color: 'text-[#F59E0B]', bg: 'bg-yellow-500/10 border border-yellow-500/20', label: 'Pendiente de pago' },
  PAGADO:    { color: 'text-green-400', bg: 'bg-green-400/10 border border-green-400/20',   label: 'Pagado'           },
  ENTREGADO: { color: 'text-[var(--cc)]', bg: 'bg-[var(--cc)]/10 border border-[var(--cc)]/20',  label: 'Entregado'        },
};

const MOTIVO_LABEL = {
  LESION: 'Lesión', VIAJE: 'Viaje',
  RETIRO_TEMPORAL: 'Retiro temporal', OTRO: 'Otro motivo',
};

const ORIGEN_CONFIG = {
  TRANSFERENCIA:           { label: 'WhatsApp',    icon: MessageCircle, color: 'text-green-400',  bg: 'bg-green-400/10 border border-green-400/20'   },
  TRANSFERENCIA_EXCEDENTE: { label: 'Saldo favor', icon: Wallet,        color: 'text-[#B68631]',  bg: 'bg-[#B68631]/10 border border-[#B68631]/20'   },
  MANUAL:                  { label: 'Manual',      icon: Pencil,        color: 'text-[var(--text-sec)]',  bg: 'bg-[var(--text-sec)]/10 border border-[var(--text-sec)]/20'   },
};

function OrigenBadge({ origen }) {
  const cfg = ORIGEN_CONFIG[origen];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function EmptySection({ texto }) {
  return <div className="text-center py-6 text-[var(--text-sec)] text-sm">{texto}</div>;
}

function EstadoBadge({ estado }) {
  const config = ESTADO_ICON[estado] || ESTADO_ICON.PENDIENTE;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />{estado}
    </span>
  );
}

function SuspendidoBadge({ motivo, detalle, cancelada }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        cancelada ? 'bg-[var(--bg-surface)]/20 text-[var(--text-sec)] border-[var(--bg-surface)]/30'
                  : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
      }`}>
        <PauseCircle className="w-3 h-3" /> SUSPENDIDO
      </span>
      <span className="text-xs text-[var(--text-sec)]">
        {MOTIVO_LABEL[motivo] || motivo}{detalle ? ` · ${detalle}` : ''}
        {cancelada && <span className="ml-1 italic">(anulada)</span>}
      </span>
    </div>
  );
}

function SeccionMensualidades({ datos, suspensiones = [] }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin datos de mensualidades" />;

  const sorted = [...datos].sort((a, b) => (parseInt(a.numero_mes) || 0) - (parseInt(b.numero_mes) || 0));
  const totalPagado    = sorted.reduce((s, m) => s + (parseFloat(m.valor_pagado)    || 0), 0);
  const totalPendiente = sorted.reduce((s, m) => s + (parseFloat(m.saldo_pendiente) || 0), 0);
  const totalSusp = sorted.filter(m => {
    const n = parseInt(m.numero_mes);
    return suspensiones.some(s => s.mes_inicio <= n && n <= s.mes_fin);
  }).length;

  const getSuspension = (numero_mes) => {
    const n = parseInt(numero_mes);
    return suspensiones.find(s => s.mes_inicio <= n && n <= s.mes_fin) || null;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-[var(--cc)]" />
        <h3 className="text-base font-semibold text-[var(--text-pri)]">Mensualidades 2026</h3>
        {totalSusp > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <PauseCircle className="w-3 h-3" /> {totalSusp} suspendido{totalSusp > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[var(--cc12)] rounded-xl p-3 border border-[var(--cc)]/20">
          <p className="text-xs text-[var(--text-sec)]">Total pagado</p>
          <p className="text-lg font-bold text-[var(--cc)]">{formatCOP(totalPagado)}</p>
        </div>
        <div className="bg-[rgba(245,158,11,0.08)] rounded-xl p-3 border border-yellow-500/20">
          <p className="text-xs text-[var(--text-sec)]">Saldo pendiente</p>
          <p className="text-lg font-bold text-[#F59E0B]">{formatCOP(totalPendiente)}</p>
        </div>
      </div>
      <div className="space-y-2">
        {sorted.map((m, i) => {
          const susp      = getSuspension(m.numero_mes);
          const penalidad = parseFloat(m.penalidad) || 0;
          const totalDeuda = (parseFloat(m.valor_oficial) || 0) + penalidad;
          return (
            <div key={i} className={`p-3 rounded-xl border ${
              susp ? 'bg-yellow-400/5 border-yellow-400/20' : 'bg-[var(--bg-surface)] border-[var(--bg-surface)]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--text-pri)] w-16 flex-shrink-0">{m.mes}</span>
                  {susp
                    ? <SuspendidoBadge motivo={susp.motivo} detalle={susp.detalle} cancelada={!susp.activa} />
                    : <EstadoBadge estado={m.estado} />}
                </div>
                <p className="text-sm font-medium text-[var(--text-pri)] flex-shrink-0 ml-2">
                  {formatCOP(m.valor_pagado)}
                  <span className="text-[var(--text-sec)]"> / {formatCOP(totalDeuda)}</span>
                </p>
              </div>
              {penalidad > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 ml-[76px]">
                  <AlertTriangle className="w-3 h-3 text-[#EF4444] flex-shrink-0" />
                  <span className="text-xs text-[#EF4444]">Penalidad por mora: {formatCOP(penalidad)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeccionPedidoUniforme({ cedula }) {
  const [pedido, setPedido]     = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/uniforms?club_id=${getClubId()}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const encontrado = (data.data || []).find(p => String(p.cedula) === String(cedula));
          setPedido(encontrado || null);
        }
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [cedula]);

  const cfg    = pedido ? (ESTADO_PEDIDO[pedido.estado] || ESTADO_PEDIDO.PENDIENTE) : null;
  const prendas = pedido?.prendas
    ? pedido.prendas.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shirt className="w-5 h-5 text-[var(--cc)]" />
        <h3 className="text-base font-semibold text-[var(--text-pri)]">Uniforme</h3>
      </div>
      {cargando ? (
        <div className="flex items-center gap-2 py-4 text-[var(--text-sec)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando pedido...</span>
        </div>
      ) : !pedido ? (
        <EmptySection texto="Sin pedido de uniforme registrado" />
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-surface)] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
              {pedido.estado === 'PENDIENTE' && <Clock className="w-3 h-3" />}
              {pedido.estado === 'PAGADO'    && <CheckCircle className="w-3 h-3" />}
              {pedido.estado === 'ENTREGADO' && <Package className="w-3 h-3" />}
              {cfg.label}
            </span>
            <span className="text-sm font-bold text-[var(--cc)]">{formatCOP(pedido.total)}</span>
          </div>
          {prendas.length > 0 && (
            <div>
              <p className="text-xs text-[var(--text-sec)] mb-1.5">Prendas</p>
              <div className="flex flex-wrap gap-1.5">
                {prendas.map((p, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--bg-surface)] text-xs text-[var(--text-pri)]">{p}</span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--bg-surface)]">
            <div>
              <p className="text-xs text-[var(--text-sec)]">Talla</p>
              <p className="text-sm font-semibold text-[var(--text-pri)]">{pedido.talla || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-sec)]">Número</p>
              <p className="text-sm font-semibold text-[var(--text-pri)] font-mono">#{pedido.numero_estampar || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-sec)]">Estampa</p>
              <p className="text-sm font-semibold text-[var(--text-pri)] truncate">{pedido.nombre_estampar || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeccionTorneos({ datos }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin torneos registrados" />;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-[#B68631]" />
        <h3 className="text-base font-semibold text-[var(--text-pri)]">Torneos</h3>
      </div>
      <div className="space-y-2">
        {datos.map((t, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-surface)]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--text-pri)]">{t.torneo || 'Torneo'}</span>
              <EstadoBadge estado={t.estado} />
            </div>
            <p className="text-sm font-medium text-[var(--text-pri)]">
              {formatCOP(t.valor_pagado)} <span className="text-[var(--text-sec)]">/ {formatCOP(t.valor_oficial)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionHistorialLazy({ cedula }) {
  const [visible, setVisible]             = useState(false);
  const [cargando, setCargando]           = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [cargado, setCargado]             = useState(false);
  const [error, setError]                 = useState('');

  const cargarHistorial = async () => {
    if (visible && cargado) { setVisible(false); return; }
    setVisible(true);
    if (cargado) return;
    setCargando(true);
    setError('');
    try {
      const res  = await authFetch(`${API_BASE_URL}/payments?club_id=${getClubId()}&cedula=${cedula}&limit=50`);
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data || [])
          .filter(p => p.estado_revision === 'aprobado_manual')
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        setTransacciones(sorted);
        setCargado(true);
      } else {
        setError('No se pudo cargar el historial');
      }
    } catch {
      setError('Error de conexión al cargar historial');
    } finally {
      setCargando(false);
    }
  };

  const estadoColor = (e) => {
    if (e?.includes('manual'))     return 'text-[#F59E0B] bg-yellow-500/10';
    if (e?.includes('automatica')) return 'text-green-400 bg-green-400/10';
    return 'text-[var(--text-sec)] bg-[var(--bg-card)]';
  };
  const estadoLabel = (e) => {
    if (e === 'aprobado_manual')          return 'Manual';
    if (e === 'aprobado_automaticamente') return 'Automático';
    return e || '—';
  };
  const conceptoLabel = (c) => {
    if (!c) return '—';
    try {
      const p = JSON.parse(c);
      if (Array.isArray(p) && p.length > 0) return p.map(x => x.descripcion || x.tipo).join(', ');
    } catch { return c; }
    return c;
  };

  return (
    <div>
      <button
        onClick={cargarHistorial}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/20 hover:bg-[var(--cc12)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--cc12)] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[var(--cc)]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--text-pri)]">Historial de transacciones</p>
            <p className="text-xs text-[var(--text-sec)]">
              {cargado ? `${transacciones.length} registro${transacciones.length !== 1 ? 's' : ''}` : 'Clic para cargar'}
            </p>
          </div>
        </div>
        {cargando  ? <Loader2 className="w-4 h-4 text-[var(--cc)] animate-spin" />
          : visible ? <EyeOff className="w-4 h-4 text-[var(--cc)]" />
          :           <Eye    className="w-4 h-4 text-[var(--cc)]" />}
      </button>

      {visible && (
        <div className="mt-3 space-y-2">
          {cargando && (
            <div className="flex items-center justify-center py-8 gap-2 text-[var(--text-sec)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando historial...</span>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-[#EF4444]">{error}</div>
          )}
          {!cargando && !error && transacciones.length === 0 && (
            <div className="text-center py-6 text-[var(--text-sec)] text-sm">Sin transacciones registradas</div>
          )}
          {!cargando && transacciones.map((p, i) => (
            <div key={i} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-surface)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[var(--text-pri)]">{formatCOP(p.suma_conceptos || p.monto)}</span>
                <span className="text-xs text-[var(--text-sec)]">
                  {p.fecha_comprobante || p.fecha_proceso || (p.created_at ? new Date(p.created_at).toLocaleDateString('es-CO') : '—')}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-sec)]">{p.banco || '—'}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(p.estado_revision)}`}>
                  {estadoLabel(p.estado_revision)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                {p.concepto ? <p className="text-xs text-[var(--text-sec)]">{conceptoLabel(p.concepto)}</p> : <span />}
                <OrigenBadge origen={p.tipo_origen} />
              </div>
              {p.referencia && <p className="text-xs text-[var(--text-sec)]">Ref: {p.referencia}</p>}
              {p.mensaje_alerta && <p className="text-xs text-[var(--cc)] mt-1 italic">📝 {p.mensaje_alerta}</p>}
              {p.url_comprobante && (
                <a href={p.url_comprobante} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-[var(--cc)] hover:underline mt-1 inline-block">
                  📎 Ver comprobante
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinancieroContent({ cedula, mensualidades = [], torneos = [], suspensiones = [] }) {
  const misMensualidades = mensualidades.filter(m => (m.cedula || m.jugador_id) === cedula);
  const misTorneos       = torneos.filter(t => t.cedula === cedula);
  const misSuspensiones  = suspensiones.filter(s => s.cedula === String(cedula));

  return (
    <div className="space-y-8">
      <SeccionMensualidades datos={misMensualidades} suspensiones={misSuspensiones} />
      <SeccionPedidoUniforme cedula={cedula} />
      <SeccionTorneos datos={misTorneos} />
      <SeccionHistorialLazy cedula={cedula} />
    </div>
  );
}
