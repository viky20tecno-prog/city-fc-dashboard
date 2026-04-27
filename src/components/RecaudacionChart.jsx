import { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList, Legend,
} from 'recharts';

const MESES_ORDEN = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const fmtK = (v) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
};

export default function RecaudacionChart({ mensualidades }) {
  const mesActualIdx = new Date().getMonth(); // 0-based

  const data = useMemo(() => {
    const meses = {};
    MESES_ORDEN.forEach((m, i) => {
      meses[m] = { mes: m.substring(0, 3), mesCompleto: m, idx: i, pagado: 0, pendiente: 0 };
    });

    mensualidades.forEach(m => {
      const mes    = m.mes || '';
      const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
      if (!meses[mesCap]) return;
      meses[mesCap].pagado    += parseFloat(m.valor_pagado)    || 0;
      meses[mesCap].pendiente += parseFloat(m.saldo_pendiente) || 0;
    });

    return Object.values(meses)
      .slice(0, mesActualIdx + 2)
      .map(m => ({
        ...m,
        total:   m.pagado + m.pendiente,
        pct:     m.pagado + m.pendiente > 0
          ? Math.round((m.pagado / (m.pagado + m.pendiente)) * 100)
          : 0,
        esActual: m.idx === mesActualIdx,
      }));
  }, [mensualidades, mesActualIdx]);

  // KPIs
  const totalPagado    = data.reduce((s, d) => s + d.pagado,    0);
  const totalPendiente = data.reduce((s, d) => s + d.pendiente, 0);
  const totalGeneral   = totalPagado + totalPendiente;
  const pctGlobal      = totalGeneral > 0 ? Math.round((totalPagado / totalGeneral) * 100) : 0;
  const mejorMes       = data.reduce((best, d) => d.pagado > (best?.pagado || 0) ? d : best, null);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5 shadow-2xl min-w-[160px]">
        <p className="text-white font-semibold text-sm mb-2">{d?.mesCompleto}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-orange-400">Pagado</span>
            <span className="text-white font-medium">{fmtCOP(d?.pagado || 0)}</span>
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-orange-400">Pendiente</span>
            <span className="text-white font-medium">{fmtCOP(d?.pendiente || 0)}</span>
          </div>
          <div className="border-t border-white/10 pt-1.5 mt-1 flex justify-between gap-4 text-xs">
            <span className="text-gray-400">% cobrado</span>
            <span className={`font-bold ${d?.pct >= 80 ? 'text-green-400' : d?.pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {d?.pct}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Etiqueta encima de barra pagado
  const PctLabel = ({ x, y, width, value, index }) => {
    const d = data[index];
    if (!d || d.pct === 0) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={d.pct >= 80 ? '#F97316' : d.pct >= 50 ? '#F59E0B' : '#EF4444'}
        textAnchor="middle"
        fontSize={10}
        fontWeight="600"
      >
        {d.pct}%
      </text>
    );
  };

  return (
    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden">

      {/* Glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-yellow-500/10 blur-2xl" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Recaudación por Mes</h2>
          <p className="text-xs text-gray-500 mt-0.5">Pagado vs pendiente · {new Date().getFullYear()}</p>
        </div>
        {/* Badge % global */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${
          pctGlobal >= 80 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
          : pctGlobal >= 50 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {pctGlobal}% cobrado
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5 relative">
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Total recaudado</p>
          <p className="text-orange-400 font-bold text-sm">{fmtK(totalPagado)}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Por cobrar</p>
          <p className="text-orange-400 font-bold text-sm">{fmtK(totalPendiente)}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Mejor mes</p>
          <p className="text-yellow-400 font-bold text-sm truncate">
            {mejorMes ? `${mejorMes.mes} ${fmtK(mejorMes.pagado)}` : '—'}
          </p>
        </div>
      </div>

      {/* Gráfica */}
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} barGap={4} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPagado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#F97316" stopOpacity={1} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="gradPendiente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#F59E0B" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="gradPagadoActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#FB923C" stopOpacity={1} />
                <stop offset="100%" stopColor="#EA580C" stopOpacity={0.9} />
              </linearGradient>
              {/* Filtro glow para mes actual */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />

            <YAxis
              tickFormatter={fmtK}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

            {/* Barra pagado */}
            <Bar dataKey="pagado" name="Pagado" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.esActual ? 'url(#gradPagadoActual)' : 'url(#gradPagado)'}
                  filter={entry.esActual ? 'url(#glow)' : undefined}
                />
              ))}
              <LabelList content={<PctLabel />} />
            </Bar>

            {/* Barra pendiente */}
            <Bar dataKey="pendiente" name="Pendiente" fill="url(#gradPendiente)" radius={[6, 6, 0, 0]} maxBarSize={32} />

            {/* Línea de tendencia (pagado) */}
            <Line
              type="monotone"
              dataKey="pagado"
              stroke="#F97316"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={false}
              strokeOpacity={0.4}
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda manual */}
      <div className="flex items-center gap-5 mt-4 relative justify-center">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm bg-[#F97316] inline-block" />
          Pagado
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm bg-[#F59E0B] inline-block opacity-80" />
          Pendiente
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-5 border-t-2 border-dashed border-[#F97316] opacity-40 inline-block" />
          Tendencia
        </span>
        <span className="flex items-center gap-1.5 text-xs text-yellow-400">
          <span className="w-3 h-3 rounded-sm bg-[#FB923C] inline-block" style={{ filter: 'blur(1px)' }} />
          Mes actual
        </span>
      </div>

    </div>
  );
}
