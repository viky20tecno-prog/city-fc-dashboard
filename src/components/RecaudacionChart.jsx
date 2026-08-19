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

// Lee la variable CSS --cc en tiempo real
function getCC() {
  if (typeof window === 'undefined') return '#E14924';
  return getComputedStyle(document.documentElement).getPropertyValue('--cc').trim() || '#E14924';
}

/* ── Tooltip ── */
function CustomTooltip({ active, payload, cc }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${cc}30`,
      borderRadius: 10, padding: '12px 14px', minWidth: 160,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: 'var(--text-pri)', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
        {d?.mesCompleto}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
          <span style={{ color: cc }}>Pagado</span>
          <span style={{ color: 'var(--text-pri)', fontWeight: 600 }}>{fmtCOP(d?.pagado || 0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
          <span style={{ color: 'var(--text-sec)' }}>Pendiente</span>
          <span style={{ color: 'var(--text-pri)', fontWeight: 600 }}>{fmtCOP(d?.pendiente || 0)}</span>
        </div>
        <div style={{
          borderTop: `1px solid ${cc}20`, paddingTop: 6, marginTop: 2,
          display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12,
        }}>
          <span style={{ color: 'var(--text-mut)' }}>% cobrado</span>
          <span style={{
            fontWeight: 700,
            color: d?.pct >= 80 ? '#22C55E' : d?.pct >= 50 ? cc : '#EF4444',
          }}>{d?.pct}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Etiqueta % encima de barra pagado ── */
function PctLabel({ x, y, width, index, data, cc }) {
  const d = data[index];
  if (!d || d.pct === 0) return null;
  const labelColor = d.pct >= 80 ? '#22C55E' : d.pct >= 50 ? cc : '#EF4444';
  return (
    <text
      x={x + width / 2} y={y - 5}
      fill={labelColor}
      textAnchor="middle" fontSize={10} fontWeight="600"
    >
      {d.pct}%
    </text>
  );
}

export default function RecaudacionChart({ mensualidades, suspensiones = [] }) {
  const mesActualIdx = new Date().getMonth();
  const anioActual   = new Date().getFullYear();
  const cc = getCC();

  // Solo suspensiones ACTIVAS excusan un mes — si se cancela, la deuda vuelve a contar.
  const esSuspendido = useMemo(() => {
    const idx = {};
    (suspensiones || []).forEach(s => {
      if (!s.activa || parseInt(s.anio) !== anioActual) return;
      const ced = String(s.cedula);
      if (!idx[ced]) idx[ced] = new Set();
      for (let m = s.mes_inicio; m <= s.mes_fin; m++) idx[ced].add(m);
    });
    return (cedula, mesNum) => idx[String(cedula)]?.has(mesNum) || false;
  }, [suspensiones, anioActual]);

  const data = useMemo(() => {
    const meses = {};
    MESES_ORDEN.forEach((m, i) => {
      meses[m] = { mes: m.substring(0, 3), mesCompleto: m, idx: i, pagado: 0, pendiente: 0 };
    });
    mensualidades.forEach(m => {
      const mes    = m.mes || '';
      const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
      if (!meses[mesCap]) return;
      meses[mesCap].pagado += parseFloat(m.valor_pagado) || 0;
      if (!esSuspendido(m.cedula, parseInt(m.numero_mes))) {
        meses[mesCap].pendiente += parseFloat(m.saldo_pendiente) || 0;
      }
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
  }, [mensualidades, mesActualIdx, esSuspendido]);

  const totalPagado    = data.reduce((s, d) => s + d.pagado,    0);
  const totalPendiente = data.reduce((s, d) => s + d.pendiente, 0);
  const totalGeneral   = totalPagado + totalPendiente;
  const pctGlobal      = totalGeneral > 0 ? Math.round((totalPagado / totalGeneral) * 100) : 0;
  const mejorMes       = data.reduce((best, d) => d.pagado > (best?.pagado || 0) ? d : best, null);

  /* ── Badge global de % ── */
  const badgeStyle = pctGlobal >= 80
    ? { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  text: '#22C55E' }
    : pctGlobal >= 50
    ? { bg: `${cc}18`,               border: `${cc}40`,              text: cc        }
    : { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)', text: '#EF4444' };

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-card)',
      border: `1px solid ${cc}22`,
      boxShadow: 'var(--shadow-card)',
      padding: 24,
      overflow: 'hidden',
    }}>
      {/* Línea de acento superior con el color del club */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${cc}55 40%, ${cc}30 60%, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-pri)', letterSpacing: '-0.2px', margin: 0 }}>
            Recaudación por Mes
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text-mut)', marginTop: 2 }}>
            Pagado vs pendiente · {new Date().getFullYear()}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, color: badgeStyle.text,
        }}>
          {pctGlobal}% cobrado
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total recaudado', value: fmtK(totalPagado),    color: cc              },
          { label: 'Por cobrar',      value: fmtK(totalPendiente), color: 'var(--text-sec)'},
          { label: 'Mejor mes',       value: mejorMes ? `${mejorMes.mes} ${fmtK(mejorMes.pagado)}` : '—', color: cc },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-sub)',
            borderRadius: 10, padding: 12,
          }}>
            <p style={{ fontSize: 10, color: 'var(--text-mut)', marginBottom: 4, letterSpacing: '0.5px', margin: '0 0 4px' }}>
              {item.label}
            </p>
            <p style={{ color: item.color, fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfica */}
      <div style={{ height: 256 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} barGap={4} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
            <defs>
              {/* Barra pagado — color del club, sólido arriba, suave abajo */}
              <linearGradient id="gradPagado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={cc} stopOpacity={0.95} />
                <stop offset="100%" stopColor={cc} stopOpacity={0.55} />
              </linearGradient>
              {/* Barra mes actual — más brillante */}
              <linearGradient id="gradPagadoActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={cc} stopOpacity={1}    />
                <stop offset="100%" stopColor={cc} stopOpacity={0.75} />
              </linearGradient>
              {/* Barra pendiente — gris neutro muy sutil */}
              <linearGradient id="gradPendiente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--text-sec)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--text-sec)" stopOpacity={0.07} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-sub)"
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: 'var(--text-mut)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtK}
              tick={{ fontSize: 11, fill: 'var(--text-mut)' }}
              axisLine={false} tickLine={false} width={48}
            />

            <Tooltip content={<CustomTooltip cc={cc} />} cursor={{ fill: `${cc}08` }} />

            {/* Barras pendiente — fondo gris neutro */}
            <Bar dataKey="pendiente" name="Pendiente" fill="url(#gradPendiente)" radius={[4, 4, 0, 0]} maxBarSize={32} />

            {/* Barras pagado — color del club */}
            <Bar dataKey="pagado" name="Pagado" radius={[5, 5, 0, 0]} maxBarSize={32}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.esActual ? 'url(#gradPagadoActual)' : 'url(#gradPagado)'}
                  style={entry.esActual ? { filter: `drop-shadow(0 0 6px ${cc}80)` } : {}}
                />
              ))}
              <LabelList content={<PctLabel data={data} cc={cc} />} />
            </Bar>

            {/* Línea de tendencia — color del club, punteada */}
            <Line
              type="monotone" dataKey="pagado"
              stroke={cc} strokeWidth={1.5} strokeDasharray="4 3"
              dot={false} activeDot={false} strokeOpacity={0.3}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16, justifyContent: 'center' }}>
        {[
          { color: cc,                   label: 'Pagado',     dash: false, glow: false },
          { color: 'var(--text-mut)',     label: 'Pendiente',  dash: false, glow: false, opacity: 0.4 },
          { color: cc,                   label: 'Tendencia',  dash: true,  glow: false },
          { color: cc,                   label: 'Mes actual', dash: false, glow: true  },
        ].map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-mut)' }}>
            {item.dash
              ? <span style={{ width: 20, borderTop: `2px dashed ${item.color}`, opacity: 0.45, display: 'inline-block' }} />
              : <span style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: item.color,
                  opacity: item.opacity ?? 1,
                  display: 'inline-block',
                  boxShadow: item.glow ? `0 0 8px ${item.color}` : 'none',
                }} />
            }
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
