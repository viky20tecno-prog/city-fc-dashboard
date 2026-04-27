import { useState } from 'react';
import { X, Calendar, Shirt, Trophy, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Eye, EyeOff, Loader2, PauseCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';

const CLUB_ID = 'city-fc';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(n) || 0);

const ESTADO_ICON = {
  AL_DIA:    { icon: CheckCircle,  color: 'text-[#00D084]', bg: 'bg-[rgba(0,208,132,0.12)]'  },
  PENDIENTE: { icon: Clock,        color: 'text-[#F5A623]', bg: 'bg-[rgba(245,166,35,0.12)]'  },
  PARCIAL:   { icon: AlertTriangle,color: 'text-[#4A9EFF]', bg: 'bg-[rgba(74,158,255,0.12)]'  },
  MORA:      { icon: XCircle,      color: 'text-[#FF5E5E]', bg: 'bg-[rgba(255,94,94,0.12)]'   },
};

const MOTIVO_LABEL = {
  LESION:           'Lesión',
  VIAJE:            'Viaje',
  RETIRO_TEMPORAL:  'Retiro temporal',
  OTRO:             'Otro motivo',
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
          ? 'bg-[#8B949E]/10 text-[#8B949E] border-[#8B949E]/20'
          : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
      }`}>
        <PauseCircle className="w-3 h-3" />
        SUSPENDIDO
      </span>
      <span className="text-xs text-[#8B949E]">
        {MOTIVO_LABEL[motivo] || motivo}{detalle ? ` · ${detalle}` : ''}
        {cancelada && <span className="ml-1 italic">(anulada)</span>}
      </span>
    </div>
  );
}

function SeccionMensualidades({ datos, suspensiones = [] }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin datos de mensualidades" />;
  const sorted = [...datos].sort((a, b) => (parseInt(a.numero_mes) || 0) - (parseInt(b.numero_mes) || 0));
  const totalPagado = sorted.reduce((s, m) => s + (parseFloat(m.valor_pagado) || 0), 0);
  const totalPendiente = sorted.reduce((s, m) => s + (parseFloat(m.saldo_pendiente) || 0), 0);
  const totalSuspendidos = sorted.filter(m => {
    const n = parseInt(m.numero_mes);
    return suspensiones.some(s => s.mes_inicio <= n && n <= s.mes_fin);
  }).length;

  // Incluye suspensiones activas Y canceladas — el jugador no estuvo presente en esos meses
  const getSuspension = (numero_mes) => {
    const n = parseInt(numero_mes);
    return suspensiones.find(s => s.mes_inicio <= n && n <= s.mes_fin) || null;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-[#00D084]" />
        <h3 className="text-base font-semibold text-[#E6EDF3]">Mensualidades 2026</h3>
        {totalSuspendidos > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <PauseCircle className="w-3 h-3" />
            {totalSuspendidos} suspendido{totalSuspendidos > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[rgba(0,208,132,0.08)] rounded-xl p-3 border border-[#00D084]/20">
          <p className="text-xs text-[#8B949E]">Total pagado</p>
          <p className="text-lg font-bold text-[#00D084]">{formatCOP(totalPagado)}</p>
        </div>
        <div className="bg-[rgba(245,166,35,0.08)] rounded-xl p-3 border border-[#F5A623]/20">
          <p className="text-xs text-[#8B949E]">Saldo pendiente</p>
          <p className="text-lg font-bold text-[#F5A623]">{formatCOP(totalPendiente)}</p>
        </div>
      </div>
      <div className="space-y-2">
        {sorted.map((m, i) => {
          const suspension = getSuspension(m.numero_mes);
          return (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                suspension
                  ? 'bg-yellow-400/5 border-yellow-400/20'
                  : 'bg-[#1E2530] border-[#30363D]'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-medium text-[#E6EDF3] w-16 flex-shrink-0">{m.mes}</span>
                {suspension
                  ? <SuspendidoBadge motivo={suspension.motivo} detalle={suspension.detalle} cancelada={!suspension.activa} />
                  : <EstadoBadge estado={m.estado} />
                }
              </div>
              <p className="text-sm font-medium text-[#E6EDF3] flex-shrink-0 ml-2">
                {formatCOP(m.valor_pagado)}
                <span className="text-[#8B949E]"> / {formatCOP(m.valor_oficial)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeccionUniformes({ datos }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin uniformes registrados" />;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shirt className="w-5 h-5 text-[#4A9EFF]" />
        <h3 className="text-base font-semibold text-[#E6EDF3]">Uniformes</h3>
      </div>
      <div className="space-y-2">
        {datos.map((u, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#1E2530] border border-[#30363D]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#E6EDF3]">{u.tipo_uniforme || 'Uniforme'}</span>
              <EstadoBadge estado={u.estado} />
            </div>
            <p className="text-sm font-medium text-[#E6EDF3]">{formatCOP(u.valor_pagado)} <span className="text-[#8B949E]">/ {formatCOP(u.valor_oficial)}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionTorneos({ datos }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin torneos registrados" />;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-[#F5A623]" />
        <h3 className="text-base font-semibold text-[#E6EDF3]">Torneos</h3>
      </div>
      <div className="space-y-2">
        {datos.map((t, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#1E2530] border border-[#30363D]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#E6EDF3]">{t.torneo || 'Torneo'}</span>
              <EstadoBadge estado={t.estado} />
            </div>
            <p className="text-sm font-medium text-[#E6EDF3]">{formatCOP(t.valor_pagado)} <span className="text-[#8B949E]">/ {formatCOP(t.valor_oficial)}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ NUEVA sección con lazy load — carga desde API solo al hacer clic
function SeccionHistorialLazy({ cedula }) {
  const [visible, setVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');

  const cargarHistorial = async () => {
    if (visible && cargado) {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (cargado) return;

    setCargando(true);
    setError('');
    try {
      const res = await authFetch(`${API_BASE_URL}/payments?club_id=${CLUB_ID}&cedula=${cedula}&limit=50`);
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
    if (estado?.includes('manual')) return 'text-[#F5A623] bg-[rgba(245,166,35,0.12)]';
    if (estado?.includes('automatica')) return 'text-[#00D084] bg-[rgba(0,208,132,0.12)]';
    return 'text-[#8B949E] bg-[#1E2530]';
  };

  const estadoLabel = (estado) => {
    if (estado === 'aprobado_manual') return 'Manual';
    if (estado === 'aprobado_automaticamente') return 'Automático';
    return estado || '—';
  };

  const conceptoLabel = (concepto) => {
    if (!concepto) return '—';
    try {
      const parsed = JSON.parse(concepto);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(c => c.descripcion || c.tipo).join(', ');
      }
    } catch {
      return concepto;
    }
    return concepto;
  };

  return (
    <div>
      {/* Botón toggle */}
      <button
        onClick={cargarHistorial}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(198,120,255,0.08)] border border-[#C678FF]/20 hover:bg-[rgba(198,120,255,0.12)] transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(198,120,255,0.12)] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#C678FF]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#E6EDF3]">Historial de transacciones</p>
            <p className="text-xs text-[#8B949E]">
              {cargado ? `${transacciones.length} registro${transacciones.length !== 1 ? 's' : ''}` : 'Clic para cargar'}
            </p>
          </div>
        </div>
        {cargando ? (
          <Loader2 className="w-4 h-4 text-[#C678FF] animate-spin" />
        ) : visible ? (
          <EyeOff className="w-4 h-4 text-[#C678FF]" />
        ) : (
          <Eye className="w-4 h-4 text-[#C678FF]" />
        )}
      </button>

      {/* Contenido */}
      {visible && (
        <div className="mt-3 space-y-2">
          {cargando && (
            <div className="flex items-center justify-center py-8 gap-2 text-[#8B949E]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando historial...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/20 text-sm text-[#FF5E5E]">
              {error}
            </div>
          )}

          {!cargando && !error && transacciones.length === 0 && (
            <div className="text-center py-6 text-[#8B949E] text-sm">
              Sin transacciones registradas
            </div>
          )}

          {!cargando && transacciones.map((p, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#1E2530] border border-[#30363D]">
              {/* Fila superior: monto + fecha */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#E6EDF3]">{formatCOP(p.suma_conceptos || p.monto)}</span>
                <span className="text-xs text-[#8B949E]">{p.fecha_comprobante || p.fecha_proceso}</span>
              </div>

              {/* Fila: método + estado */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#8B949E]">{p.banco || '—'}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(p.estado_revision)}`}>
                  {estadoLabel(p.estado_revision)}
                </span>
              </div>

              {/* Referencia */}
              {p.referencia && (
                <p className="text-xs text-[#8B949E]">Ref: {p.referencia}</p>
              )}

              {/* Concepto */}
              {p.concepto && (
                <p className="text-xs text-[#8B949E] mt-1">
                  {conceptoLabel(p.concepto)}
                </p>
              )}

              {/* Nota/mensaje_alerta */}
              {p.mensaje_alerta && (
                <p className="text-xs text-[#C678FF] mt-1 italic">📝 {p.mensaje_alerta}</p>
              )}

              {/* Comprobante */}
              {p.url_comprobante && (
                <a href={p.url_comprobante} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#4A9EFF] hover:underline mt-1 inline-block">
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
  return <div className="text-center py-6 text-[#8B949E] text-sm">{texto}</div>;
}

export default function EstadoCuenta({ jugador, mensualidades, uniformes, torneos, suspensiones = [], onClose }) {
  const cedula = jugador.cedula;
  const nombre = `${jugador['nombre(s)'] || jugador.nombre || ''} ${jugador['apellido(s)'] || jugador.apellidos || ''}`.trim();

  const misMensualidades = mensualidades.filter(m => (m.cedula || m.jugador_id) === cedula);
  const misUniformes = uniformes.filter(u => u.cedula === cedula);
  const misTorneos = torneos.filter(t => t.cedula === cedula);
  const misSuspensiones = suspensiones.filter(s => s.cedula === String(cedula));

  return (
    <div className="fixed inset-0 bg-[#0D1117]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-[#30363D]">
          <div>
            <h2 className="text-xl font-bold text-[#E6EDF3]">{nombre}</h2>
            <p className="text-sm text-[#8B949E]">CC {cedula} · {jugador.celular}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#1E2530] transition-colors">
            <X className="w-5 h-5 text-[#8B949E]" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <SeccionMensualidades datos={misMensualidades} suspensiones={misSuspensiones} />
          <SeccionUniformes datos={misUniformes} />
          <SeccionTorneos datos={misTorneos} />
          {/* ✅ Historial lazy — se carga desde API solo al hacer clic */}
          <SeccionHistorialLazy cedula={cedula} />
        </div>
      </div>
    </div>
  );
}
