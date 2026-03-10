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

    // Solo mostrar hasta el mes actual + 1
    const mesActual = new Date().getMonth(); // 0-indexed
    return Object.values(meses).slice(0, mesActual + 2);
  }, [mensualidades]);

  const formatCOP = (v) => `$${(v / 1000).toFixed(0)}k`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-[#1E2530] border border-[#30363D] rounded-xl p-3 shadow-lg">
        <p className="text-[#E6EDF3] font-medium text-sm mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6">
      <h2 className="text-lg font-semibold text-[#E6EDF3] mb-4">Recaudación por Mes</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#8B949E' }} axisLine={{ stroke: '#30363D' }} tickLine={{ stroke: '#30363D' }} />
            <YAxis tickFormatter={formatCOP} tick={{ fontSize: 12, fill: '#8B949E' }} axisLine={{ stroke: '#30363D' }} tickLine={{ stroke: '#30363D' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pagado" name="Pagado" fill="#00D084" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pendiente" name="Pendiente" fill="#F5A623" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
