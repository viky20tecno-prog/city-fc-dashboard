import { useState, useEffect } from 'react';
import { X, Calendar, Shirt, Trophy, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Eye, EyeOff, Loader2, PauseCircle, Package } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

const CLUB_ID = 'city-fc';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(n) || 0);

const ESTADO_ICON = {
  AL_DIA:    { icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-400/10 border border-green-400/20'  },
  PENDIENTE: { icon: Clock,         color: 'text-[#F59E0B]',  bg: 'bg-yellow-500/10 border border-yellow-500/20' },
  PARCIAL:   { icon: AlertTriangle, color: 'text-[#00AAFF]',  bg: 'bg-[#00AAFF]/10 border border-[#00AAFF]/20'  },
  MORA:      { icon: XCircle,       color: 'text-[#EF4444]',  bg: 'bg-red-500/10 border border-red-500/20'      },
};

const ESTADO_PEDIDO = {
  PENDIENTE: { color: 'text-[#F59E0B]', bg: 'bg-yellow-500/10 border border-yellow-500/20', label: 'Pendiente de pago' },
  PAGADO:    { color: 'text-green-400', bg: 'bg-green-400/10 border border-green-400/20',   label: 'Pagado'           },
  ENTREGADO: { color: 'text-[#00AAFF]', bg: 'bg-[#00AAFF]/10 border border-[#00AAFF]/20', label: 'Entregado'        },
};

const MOTIVO_LABEL = {
  LESION:          'Lesión',
  VIAJE:           'Viaje',
  RETIRO_TEMPORAL: 'Retiro temporal',
  OTRO:            'Otro motivo',
};

function EstadoBadge({ estado }) {
  const config = ESTADO_ICON[estado] || ESTADO_ICON.PENDIENTE;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {estado}
    </span>
  );
}

function SuspendidoBadge({ motivo, detalle, cancelada }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        cancelada
          ? 'bg-[#737373]/10 text-[#737373] border-[#737373]/20'
          : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
      }`}>
        <PauseCircle className="w-3 h-3" />
        SUSPENDIDO
      </span>
      <span className="text-xs text-[#737373]">
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
  const totalSuspendidos = sorted.filter(m => {
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
        <Calendar className="w-5 h-5 text-[#00AAFF]" />
        <h3 className="text-base font-semibold text-[#F5F5F5]">Mensualidades 2026</h3>
        {totalSuspendidos > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <PauseCircle className="w-3 h-3" />
            {totalSuspendidos} suspendido{totalSuspendidos > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[rgba(0,170,255,0.08)] rounded-xl p-3 border border-[#00AAFF]/20">
          <p className="text-xs text-[#737373]">Total pagado</p>
          <p className="text-lg font-bold text-[#00AAFF]">{formatCOP(totalPagado)}</p>
        </div>
        <div className="bg-[rgba(245,158,11,0.08)] rounded-xl p-3 border border-yellow-500/20">
          <p className="text-xs text-[#737373]">Saldo pendiente</p>
          <p className="text-lg font-bold text-[#F59E0B]">{formatCOP(totalPendiente)}</p>
        </div>
      </div>
      <div className="space-y-2">
        {sorted.map((m, i) => {
          const suspension = getSuspension(m.numero_mes);
          return (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
              suspension ? 'bg-yellow-400/5 border-yellow-400/20' : 'bg-[#0F1F36] border-[#1A3A5C]'
            }`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-medium text-[#F5F5F5] w-16 flex-shrink-0">{m.mes}</span>
                {suspension
                  ? <SuspendidoBadge motivo={suspension.motivo} detalle={suspension.detalle} cancelada={!suspension.activa} />
                  : <EstadoBadge estado={m.estado} />
                }
              </div>
              <p className="text-sm font-medium text-[#F5F5F5] flex-shrink-0 ml-2">
                {formatCOP(m.valor_pagado)}
                <span className="text-[#737373]"> / {formatCOP(m.valor_oficial)}</span>
              </p>
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
    authFetch(`${API_BASE_URL}/uniforms?club_id=${CLUB_ID}`)
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

  const cfg = pedido ? (ESTADO_PEDIDO[pedido.estado] || ESTADO_PEDIDO.PENDIENTE) : null;

  const prendas = pedido?.prendas
    ? pedido.prendas.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shirt className="w-5 h-5 text-[#00AAFF]" />
        <h3 className="text-base font-semibold text-[#F5F5F5]">Uniforme</h3>
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 py-4 text-[#737373]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando pedido...</span>
        </div>
      ) : !pedido ? (
        <EmptySection texto="Sin pedido de uniforme registrado" />
      ) : (
        <div className="bg-[#0F1F36] border border-[#1A3A5C] rounded-xl p-4 space-y-3">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
              {pedido.estado === 'PENDIENTE' && <Clock className="w-3 h-3" />}
              {pedido.estado === 'PAGADO'    && <CheckCircle className="w-3 h-3" />}
              {pedido.estado === 'ENTREGADO' && <Package className="w-3 h-3" />}
              {cfg.label}
            </span>
            <span className="text-sm font-bold text-[#00AAFF]">{formatCOP(pedido.total)}</span>
          </div>

          {/* Prendas */}
          {prendas.length > 0 && (
            <div>
              <p className="text-xs text-[#737373] mb-1.5">Prendas</p>
              <div className="flex flex-wrap gap-1.5">
                {prendas.map((p, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-[#060C18] border border-[#1A3A5C] text-xs text-[#F5F5F5]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detalles */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#1A3A5C]">
            <div>
              <p className="text-xs text-[#737373]">Talla</p>
              <p className="text-sm font-semibold text-[#F5F5F5]">{pedido.talla || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373]">Número</p>
              <p className="text-sm font-semibold text-[#F5F5F5] font-mono">#{pedido.numero_estampar || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373]">Estampa</p>
              <p className="text-sm font-semibold text-[#F5F5F5] truncate">{pedido.nombre_estampar || '—'}</p>
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
        <Trophy className="w-5 h-5 text-[#F59E0B]" />
        <h3 className="text-base font-semibold text-[#F5F5F5]">Torneos</h3>
      </div>
      <div className="space-y-2">
        {datos.map((t, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#0F1F36] border border-[#1A3A5C]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#F5F5F5]">{t.torneo || 'Torneo'}</span>
              <EstadoBadge estado={t.estado} />
            </div>
            <p className="text-sm font-medium text-[#F5F5F5]">
              {formatCOP(t.valor_pagado)} <span className="text-[#737373]">/ {formatCOP(t.valor_oficial)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionHistorialLazy({ cedula }) {
  const [visible, setVisible]           = useState(false);
  const [cargando, setCargando]         = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [cargado, setCargado]           = useState(false);
  const [error, setError]               = useState('');

  const cargarHistorial = async () => {
    if (visible && cargado) { setVisible(false); return; }
    setVisible(true);
    if (cargado) return;
    setCargando(true);
    setError('');
    try {
      const res  = await authFetch(`${API_BASE_URL}/payments?club_id=${CLUB_ID}&cedula=${cedula}&limit=50`);
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data || []).sort((a, b) =>
          (b.fecha_proceso || '').localeCompare(a.fecha_proceso || '')
        );
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

  const estadoColor = (estado) => {
    if (estado?.includes('manual'))     return 'text-[#F59E0B] bg-yellow-500/10';
    if (estado?.includes('automatica')) return 'text-green-400 bg-green-400/10';
    return 'text-[#737373] bg-[#0F1F36]';
  };

  const estadoLabel = (estado) => {
    if (estado === 'aprobado_manual')          return 'Manual';
    if (estado === 'aprobado_automaticamente') return 'Automático';
    return estado || '—';
  };

  const conceptoLabel = (concepto) => {
    if (!concepto) return '—';
    try {
      const parsed = JSON.parse(concepto);
      if (Array.isArray(parsed) && parsed.length > 0)
        return parsed.map(c => c.descripcion || c.tipo).join(', ');
    } catch { return concepto; }
    return concepto;
  };

  return (
    <div>
      <button onClick={cargarHistorial}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(198,120,255,0.08)] border border-[#C678FF]/20 hover:bg-[rgba(198,120,255,0.12)] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(198,120,255,0.12)] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#C678FF]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#F5F5F5]">Historial de transacciones</p>
            <p className="text-xs text-[#737373]">
              {cargado ? `${transacciones.length} registro${transacciones.length !== 1 ? 's' : ''}` : 'Clic para cargar'}
            </p>
          </div>
        </div>
        {cargando ? <Loader2 className="w-4 h-4 text-[#C678FF] animate-spin" />
          : visible ? <EyeOff className="w-4 h-4 text-[#C678FF]" />
          : <Eye className="w-4 h-4 text-[#C678FF]" />}
      </button>

      {visible && (
        <div className="mt-3 space-y-2">
          {cargando && (
            <div className="flex items-center justify-center py-8 gap-2 text-[#737373]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando historial...</span>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-[#EF4444]">{error}</div>
          )}
          {!cargando && !error && transacciones.length === 0 && (
            <div className="text-center py-6 text-[#737373] text-sm">Sin transacciones registradas</div>
          )}
          {!cargando && transacciones.map((p, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#0F1F36] border border-[#1A3A5C]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#F5F5F5]">{formatCOP(p.suma_conceptos || p.monto)}</span>
                <span className="text-xs text-[#737373]">{p.fecha_comprobante || p.fecha_proceso}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#737373]">{p.banco || '—'}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(p.estado_revision)}`}>
                  {estadoLabel(p.estado_revision)}
                </span>
              </div>
              {p.referencia && <p className="text-xs text-[#737373]">Ref: {p.referencia}</p>}
              {p.concepto && <p className="text-xs text-[#737373] mt-1">{conceptoLabel(p.concepto)}</p>}
              {p.mensaje_alerta && <p className="text-xs text-[#C678FF] mt-1 italic">📝 {p.mensaje_alerta}</p>}
              {p.url_comprobante && (
                <a href={p.url_comprobante} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#00AAFF] hover:underline mt-1 inline-block">
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

function EmptySection({ texto }) {
  return <div className="text-center py-6 text-[#737373] text-sm">{texto}</div>;
}

export default function EstadoCuenta({ jugador, mensualidades, torneos, suspensiones = [], onClose }) {
  const cedula  = jugador.cedula;
  const nombre  = `${jugador['nombre(s)'] || jugador.nombre || ''} ${jugador['apellido(s)'] || jugador.apellidos || ''}`.trim();

  const misMensualidades = mensualidades.filter(m => (m.cedula || m.jugador_id) === cedula);
  const misTorneos       = torneos.filter(t => t.cedula === cedula);
  const misSuspensiones  = suspensiones.filter(s => s.cedula === String(cedula));

  return (
    <div className="fixed inset-0 bg-[#060C18]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#0A1628] rounded-2xl border border-[#1A3A5C] w-full max-w-2xl my-8 shadow-[0_8px_40px_rgba(0,50,150,0.3)]">
        <div className="flex items-center justify-between p-6 border-b border-[#1A3A5C]">
          <div>
            <h2 className="text-xl font-bold text-[#F5F5F5]">{nombre}</h2>
            <p className="text-sm text-[#737373]">CC {cedula} · {jugador.celular}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#0F1F36] transition-colors">
            <X className="w-5 h-5 text-[#737373]" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <SeccionMensualidades datos={misMensualidades} suspensiones={misSuspensiones} />
          <SeccionPedidoUniforme cedula={cedula} />
          <SeccionTorneos datos={misTorneos} />
          <SeccionHistorialLazy cedula={cedula} />
        </div>
      </div>
    </div>
  );
}
