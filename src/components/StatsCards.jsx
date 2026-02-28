import { Users, CheckCircle, AlertTriangle, XCircle, DollarSign, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, subtext, color }) {
  const colors = {
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ pagos, jugadores, morosos }) {
  const mesActual = new Date().toLocaleString('es-CO', { month: 'long' }).toLowerCase();
  
  const pagosDelMes = pagos.filter(p => p.mes?.toLowerCase() === mesActual || p.mes?.toLowerCase() === 'febrero');
  const pagados = pagosDelMes.filter(p => p.estado === 'PAGADO');
  const pendientes = pagosDelMes.filter(p => p.estado === 'PENDIENTE');
  const enMora = pagosDelMes.filter(p => p.estado === 'MORA');
  const abonos = pagosDelMes.filter(p => p.estado === 'ABONO PARCIAL');
  
  const recaudado = pagados.reduce((sum, p) => sum + (parseInt(p.monto) || 0), 0);
  const totalEsperado = jugadores.length * 65000;

  const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        icon={Users}
        label="Jugadores"
        value={jugadores.length}
        subtext="Activos"
        color="blue"
      />
      <StatCard
        icon={CheckCircle}
        label="Al Día"
        value={pagados.length}
        subtext={`${jugadores.length ? Math.round((pagados.length / jugadores.length) * 100) : 0}%`}
        color="green"
      />
      <StatCard
        icon={Clock}
        label="Pendientes"
        value={pendientes.length}
        subtext="Por cobrar"
        color="yellow"
      />
      <StatCard
        icon={XCircle}
        label="En Mora"
        value={morosos.length}
        subtext={`${morosos.length} jugadores`}
        color="red"
      />
      <StatCard
        icon={AlertTriangle}
        label="Abonos"
        value={abonos.length}
        subtext="Parciales"
        color="purple"
      />
      <StatCard
        icon={DollarSign}
        label="Recaudado"
        value={formatCOP(recaudado)}
        subtext={`de ${formatCOP(totalEsperado)}`}
        color="green"
      />
    </div>
  );
}
