import { X, Calendar, Shirt, Trophy, FileText, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(n) || 0);

const ESTADO_ICON = {
  AL_DIA: { icon: CheckCircle, color: 'text-[#00D084]', bg: 'bg-[rgba(0,208,132,0.12)]' },
  PENDIENTE: { icon: Clock, color: 'text-[#F5A623]', bg: 'bg-[rgba(245,166,35,0.12)]' },
  PARCIAL: { icon: AlertTriangle, color: 'text-[#4A9EFF]', bg: 'bg-[rgba(74,158,255,0.12)]' },
  MORA: { icon: XCircle, color: 'text-[#FF5E5E]', bg: 'bg-[rgba(255,94,94,0.12)]' },
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

function SeccionMensualidades({ datos }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin datos de mensualidades" />;

  const sorted = [...datos].sort((a, b) => (parseInt(a.numero_mes) || 0) - (parseInt(b.numero_mes) || 0));
  const totalPagado = sorted.reduce((s, m) => s + (parseFloat(m.valor_pagado) || 0), 0);
  const totalPendiente = sorted.reduce((s, m) => s + (parseFloat(m.saldo_pendiente) || 0), 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-[#00D084]" />
        <h3 className="text-base font-semibold text-[#E6EDF3]">Mensualidades 2026</h3>
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
        {sorted.map((m, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#1E2530] border border-[#30363D]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#E6EDF3] w-24">{m.mes}</span>
              <EstadoBadge estado={m.estado} />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[#E6EDF3]">{formatCOP(m.valor_pagado)} <span className="text-[#8B949E]">/ {formatCOP(m.valor_oficial)}</span></p>
            </div>
          </div>
        ))}
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
            <div className="text-right">
              <p className="text-sm font-medium text-[#E6EDF3]">{formatCOP(u.valor_pagado)} <span className="text-[#8B949E]">/ {formatCOP(u.valor_oficial)}</span></p>
            </div>
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
            <div className="text-right">
              <p className="text-sm font-medium text-[#E6EDF3]">{formatCOP(t.valor_pagado)} <span className="text-[#8B949E]">/ {formatCOP(t.valor_oficial)}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionHistorial({ datos }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin pagos registrados" />;

  const sorted = [...datos].sort((a, b) => (b.fecha_proceso || '').localeCompare(a.fecha_proceso || ''));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-[#C678FF]" />
        <h3 className="text-base font-semibold text-[#E6EDF3]">Historial de comprobantes</h3>
      </div>
      <div className="space-y-2">
        {sorted.map((p, i) => (
          <div key={i} className="p-3 rounded-xl bg-[#1E2530] border border-[#30363D]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#E6EDF3]">{formatCOP(p.monto_imagen)}</span>
              <span className="text-xs text-[#8B949E]">{p.fecha_proceso}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8B949E]">{p.banco} · Ref: {p.referencia}</span>
              <span className={`text-xs font-medium ${p.estado_revision === 'aprobado_automaticamente' ? 'text-[#00D084]' : 'text-[#F5A623]'}`}>
                {p.estado_revision}
              </span>
            </div>
            {p.url_comprobante && (
              <a href={p.url_comprobante} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4A9EFF] hover:underline mt-1 inline-block">
                📎 Ver comprobante
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptySection({ texto }) {
  return (
    <div className="text-center py-6 text-[#8B949E] text-sm">
      {texto}
    </div>
  );
}

export default function EstadoCuenta({ jugador, mensualidades, uniformes, torneos, registroPagos, onClose }) {
  const cedula = jugador.cedula;
  const nombre = `${jugador['nombre(s)'] || jugador.nombre || ''} ${jugador['apellido(s)'] || jugador.apellidos || ''}`.trim();

  const misMensualidades = mensualidades.filter(m => (m.cedula || m.jugador_id) === cedula);
  const misUniformes = uniformes.filter(u => u.cedula === cedula);
  const misTorneos = torneos.filter(t => t.cedula === cedula);
  const misPagos = registroPagos.filter(p => p.telefono === jugador.celular || p.cedula === cedula);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#30363D]">
          <div>
            <h2 className="text-xl font-bold text-[#E6EDF3]">{nombre}</h2>
            <p className="text-sm text-[#8B949E]">CC {cedula} · {jugador.celular}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#1E2530] transition-colors">
            <X className="w-5 h-5 text-[#8B949E]" />
          </button>
        </div>

        {/* Secciones */}
        <div className="p-6 space-y-8">
          <SeccionMensualidades datos={misMensualidades} />
          <SeccionUniformes datos={misUniformes} />
          <SeccionTorneos datos={misTorneos} />
          <SeccionHistorial datos={misPagos} />
        </div>
      </div>
    </div>
  );
}
