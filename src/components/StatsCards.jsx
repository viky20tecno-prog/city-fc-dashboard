import { Users, CheckCircle, AlertTriangle, XCircle, DollarSign, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, subtext, color, wide }) {
  const colors = {
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', glow: 'shadow-[0_0_20px_rgba(0,208,132,0.15)]' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(245,166,35,0.15)]' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(255,94,94,0.15)]' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(74,158,255,0.15)]' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(192,120,255,0.15)]' },
  };

  const c = colors[color] || colors.blue;

  return (
    <div
      className={`group relative rounded-2xl p-6 overflow-hidden transition-all duration-300
      bg-white/5 backdrop-blur-xl border border-white/10
      hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]
      ${wide ? 'xl:col-span-2' : ''}`}
    >
      
      {/* Glow background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className={`absolute inset-0 ${c.glow}`} />
      </div>

      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-400">{label}</p>

          <p className="text-2xl font-bold mt-1 text-white tracking-tight">
            {value}
          </p>

          {subtext && (
            <p className="text-sm text-gray-500 mt-1">{subtext}</p>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0
          transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ mensualidades, jugadores, morosos }) {
  const mesActual = new Date().getMonth() + 1;

  const pagosDelMes = mensualidades.filter(m => parseInt(m.numero_mes) === mesActual);

  const alDia = pagosDelMes.filter(m => m.estado === 'AL_DIA');
  const pendientes = pagosDelMes.filter(m => m.estado === 'PENDIENTE');
  const parciales = pagosDelMes.filter(m => m.estado === 'PARCIAL');
  const enMora = pagosDelMes.filter(m => m.estado === 'MORA');

  const activos = jugadores.filter(j => (j.activo || '').toUpperCase() === 'SI');

  const recaudado = mensualidades.reduce((sum, m) => sum + (parseFloat(m.valor_pagado) || 0), 0);
  const totalEsperado = mensualidades.reduce((sum, m) => sum + (parseFloat(m.valor_oficial) || 0), 0);

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
      <StatCard icon={Users} label="Jugadores" value={activos.length} subtext="Activos" color="blue" />
      <StatCard icon={CheckCircle} label="Al Día" value={alDia.length} subtext={`${pagosDelMes.length ? Math.round((alDia.length / pagosDelMes.length) * 100) : 0}%`} color="green" />
      <StatCard icon={Clock} label="Pendientes" value={pendientes.length} subtext="Por cobrar" color="yellow" />
      <StatCard icon={XCircle} label="En Mora" value={enMora.length + morosos.length} subtext={`${enMora.length + morosos.length} jugadores`} color="red" />
      <StatCard icon={AlertTriangle} label="Parciales" value={parciales.length} subtext="Abonos" color="purple" />
      <StatCard icon={DollarSign} label="Recaudado" value={formatCOP(recaudado)} subtext={`de ${formatCOP(totalEsperado)}`} color="green" wide />
    </div>
  );
}
