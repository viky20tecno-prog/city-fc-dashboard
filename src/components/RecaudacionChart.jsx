import { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
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
  const mesActualIdx = new Date().getMonth();

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
        total:    m.pagado + m.pendiente,
        pct:      m.pagado + m.pendiente > 0
          ? Math.round((m.pagado / (m.pagado + m.pendiente)) * 100)
          : 0,
        esActual: m.idx === mesActualIdx,
      }));
  }, [mensualidades, mesActualIdx]);

  const totalPagado    = data.reduce((s, d) => s + d.pagado,    0);
  const totalPendiente = data.reduce((s, d) => s + d.pendiente, 0);
  const totalGeneral   = totalPagado + totalPendiente;
  const pctGlobal      = totalGeneral > 0 ? Math.round((totalPagado / totalGeneral) * 100) : 0;
  const mejorMes       = data.reduce((best, d) => d.pagado > (best?.pagado || 0) ? d : best, null);

  /* ── tooltip ── */
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{
        background: '#141414', border: '1px solid rgba(225,73,36,0.35)',
        borderRadius: '10px', padding: '12px 14px', minWidth: '160px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>{d?.mesCompleto}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
            <span style={{ color: '#E14924' }}>Pagado</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{fmtCOP(d?.pagado || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
            <span style={{ color: '#B68631' }}>Pendiente</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{fmtCOP(d?.pendiente || 0)}</span>
          </div>
          <div style={{
            borderTop: '1px solid rgba(225,73,36,0.2)', paddingTop: '6px', marginTop: '2px',
            display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px',
          }}>
            <span style={{ color: '#7A7A7A' }}>% cobrado</span>
            <span style={{
              fontWeight: 700,
              color: d?.pct >= 80 ? '#22C55E' : d?.pct >= 50 ? '#F59E0B' : '#EF4444',
            }}>{d?.pct}%</span>
          </div>
        </div>
      </div>
    );
  };

  /* ── etiqueta % encima de barra ── */
  const PctLabel = ({ x, y, width, index }) => {
    const d = data[index];
    if (!d || d.pct === 0) return null;
    return (
      <text
        x={x + width / 2} y={y - 5}
        fill={d.pct >= 80 ? '#22C55E' : d.pct >= 50 ? '#F59E0B' : '#EF4444'}
        textAnchor="middle" fontSize={10} fontWeight="600"
      >
        {d.pct}%
      </text>
    );
  };

  /* ── color del badge global ── */
  const badgeStyle = pctGlobal >= 80
    ? { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  text: '#22C55E'  }
    : pctGlobal >= 50
    ? { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#F59E0B'  }
    : { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#EF4444'  };

  return (
    <div style={{
      position: 'relative',
      background: '#141414',
      borderRadius: '16px',
      border: '1px solid rgba(225,73,36,0.22)',
      padding: '24px',
      overflow: 'hidden',
    }}>
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(225,73,36,0.5) 40%, rgba(182,134,49,0.3) 60%, transparent)',
        pointerEvents: 'none',
      }} />
      {/* ambient glow */}
      <div style={{
        position: 'absolute', top: 0, left: '25%', right: '25%', height: '1px',
        background: 'rgba(225,73,36,0.3)', filter: 'blur(4px)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', letterSpacing: '-0.2px' }}>
            Recaudación por Mes
          </h2>
          <p style={{ fontSize: '11px', color: '#5A5A5A', marginTop: '2px' }}>
            Pagado vs pendiente · {new Date().getFullYear()}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
          background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, color: badgeStyle.text,
        }}>
          {pctGlobal}% cobrado
        </div>
      </div>

      {/* KPIs internos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total recaudado', value: fmtK(totalPagado),    color: '#E14924' },
          { label: 'Por cobrar',      value: fmtK(totalPendiente), color: '#B68631' },
          { label: 'Mejor mes',       value: mejorMes ? `${mejorMes.mes} ${fmtK(mejorMes.pagado)}` : '—', color: '#F59E0B' },
        ].map((item, i) => (
          <div key={i} style={{
            background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '12px',
          }}>
            <p style={{ fontSize: '10px', color: '#5A5A5A', marginBottom: '4px', letterSpacing: '0.5px' }}>{item.label}</p>
            <p style={{ color: item.color, fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfica */}
      <div style={{ height: '256px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} barGap={4} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPagado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#E14924" stopOpacity={1} />
                <stop offset="100%" stopColor="#8B2A14" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="gradPendiente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#B68631" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7A5820" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradPagadoActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#FF6B3D" stopOpacity={1} />
                <stop offset="100%" stopColor="#E14924" stopOpacity={0.85} />
              </linearGradient>
              <filter id="glowOrange">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: '#5A5A5A' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtK}
              tick={{ fontSize: 11, fill: '#5A5A5A' }}
              axisLine={false} tickLine={false} width={48}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

            <Bar dataKey="pagado" name="Pagado" radius={[5, 5, 0, 0]} maxBarSize={32}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.esActual ? 'url(#gradPagadoActual)' : 'url(#gradPagado)'}
                  filter={entry.esActual ? 'url(#glowOrange)' : undefined}
                />
              ))}
              <LabelList content={<PctLabel />} />
            </Bar>

            <Bar dataKey="pendiente" name="Pendiente" fill="url(#gradPendiente)" radius={[5, 5, 0, 0]} maxBarSize={32} />

            <Line
              type="monotone" dataKey="pagado"
              stroke="#E14924" strokeWidth={1.5} strokeDasharray="4 3"
              dot={false} activeDot={false} strokeOpacity={0.35}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px', justifyContent: 'center' }}>
        {[
          { color: '#E14924', label: 'Pagado',      dash: false },
          { color: '#B68631', label: 'Pendiente',   dash: false },
          { color: '#E14924', label: 'Tendencia',   dash: true  },
          { color: '#FF6B3D', label: 'Mes actual',  dash: false, glow: true },
        ].map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#5A5A5A' }}>
            {item.dash
              ? <span style={{ width: '20px', borderTop: `2px dashed ${item.color}`, opacity: 0.5, display: 'inline-block' }} />
              : <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color, display: 'inline-block', boxShadow: item.glow ? `0 0 6px ${item.color}` : 'none' }} />
            }
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
