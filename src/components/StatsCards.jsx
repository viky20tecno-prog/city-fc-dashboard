import { Users, CheckCircle, AlertTriangle, XCircle, DollarSign, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, subtext, color }) {
  const colors = {
    green: { bg: 'bg-[rgba(0,208,132,0.12)]', icon: 'text-[#00D084]' },
    yellow: { bg: 'bg-[rgba(245,166,35,0.12)]', icon: 'text-[#F5A623]' },
    red: { bg: 'bg-[rgba(255,94,94,0.12)]', icon: 'text-[#FF5E5E]' },
    blue: { bg: 'bg-[rgba(74,158,255,0.12)]', icon: 'text-[#4A9EFF]' },
    purple: { bg: 'bg-[rgba(192,120,255,0.12)]', icon: 'text-[#C678FF]' },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-6 hover:border-[#00D084]/30 transition-colors overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#8B949E]">{label}</p>
          <p className="text-2xl font-bold text-[#E6EDF3] mt-1 truncate">{value}</p>
          {subtext && <p className="text-sm text-[#8B949E] mt-1 truncate">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
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
      <StatCard icon={Users} label="Jugadores" value={jugadores.length} subtext="Activos" color="blue" />
      <StatCard icon={CheckCircle} label="Al Día" value={pagados.length} subtext={`${jugadores.length ? Math.round((pagados.length / jugadores.length) * 100) : 0}%`} color="green" />
      <StatCard icon={Clock} label="Pendientes" value={pendientes.length} subtext="Por cobrar" color="yellow" />
      <StatCard icon={XCircle} label="En Mora" value={morosos.length} subtext={`${morosos.length} jugadores`} color="red" />
      <StatCard icon={AlertTriangle} label="Abonos" value={abonos.length} subtext="Parciales" color="purple" />
      <StatCard icon={DollarSign} label="Recaudado" value={formatCOP(recaudado)} subtext={`de ${formatCOP(totalEsperado)}`} color="green" />
    </div>
  );
}
