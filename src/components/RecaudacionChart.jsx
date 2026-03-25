import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MESES_ORDEN = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function RecaudacionChart({ mensualidades }) {
  const data = useMemo(() => {
    const meses = {};
    MESES_ORDEN.forEach(m => {
      meses[m] = { mes: m.substring(0, 3), pagado: 0, pendiente: 0 };
    });

    mensualidades.forEach(m => {
      const mes = m.mes || '';
      const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
      if (!meses[mesCap]) return;

      const pagado = parseFloat(m.valor_pagado) || 0;
      const pendiente = parseFloat(m.saldo_pendiente) || 0;

      meses[mesCap].pagado += pagado;
      meses[mesCap].pendiente += pendiente;
    });

    const mesActual = new Date().getMonth();
    return Object.values(meses).slice(0, mesActual + 2);
  }, [mensualidades]);

  const formatCOP = (v) => `$${(v / 1000).toFixed(0)}k`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-[#020617]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <p className="text-white font-medium text-sm mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}:{' '}
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0,
            }).format(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden">

      {/* glow effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-cyan-500/10 blur-2xl" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-4 tracking-tight">
        Recaudación por Mes
      </h2>

      <div className="h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />

            <YAxis
              tickFormatter={formatCOP}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* barras */}
            <Bar
              dataKey="pagado"
              name="Pagado"
              fill="url(#colorPagado)"
              radius={[8, 8, 0, 0]}
            />

            <Bar
              dataKey="pendiente"
              name="Pendiente"
              fill="url(#colorPendiente)"
              radius={[8, 8, 0, 0]}
            />

            {/* gradientes */}
            <defs>
              <linearGradient id="colorPagado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D084" stopOpacity={1} />
                <stop offset="100%" stopColor="#00D084" stopOpacity={0.6} />
              </linearGradient>

              <linearGradient id="colorPendiente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5A623" stopOpacity={1} />
                <stop offset="100%" stopColor="#F5A623" stopOpacity={0.6} />
              </linearGradient>
            </defs>

          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
