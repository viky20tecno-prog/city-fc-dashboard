import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RecaudacionChart({ pagos }) {
  const data = useMemo(() => {
    const meses = {};
    pagos.forEach(p => {
      const mes = p.mes || 'Sin mes';
      if (!meses[mes]) meses[mes] = { mes, pagado: 0, pendiente: 0, mora: 0 };
      const monto = parseInt(p.monto) || 0;
      if (p.estado === 'PAGADO') meses[mes].pagado += monto;
      else if (p.estado === 'MORA') meses[mes].mora += monto;
      else meses[mes].pendiente += monto;
    });
    return Object.values(meses);
  }, [pagos]);

  const formatCOP = (v) => `$${(v / 1000).toFixed(0)}k`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recaudación por Mes</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatCOP} tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="pagado" name="Pagado" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pendiente" name="Pendiente" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="mora" name="Mora" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
