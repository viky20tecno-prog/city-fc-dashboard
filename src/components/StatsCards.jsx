import { Users, CheckCircle, AlertTriangle, XCircle, DollarSign, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, subtext, color, wide }) {
  const colors = {
    green:  { bg: 'bg-green-500/10',  icon: 'text-green-400',  glow: 'shadow-[0_0_20px_rgba(0,208,132,0.15)]' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(245,166,35,0.15)]' },
    red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    glow: 'shadow-[0_0_20px_rgba(255,94,94,0.15)]' },
    blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   glow: 'shadow-[0_0_20px_rgba(74,158,255,0.15)]' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(192,120,255,0.15)]' },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className={`group relative rounded-2xl p-6 overflow-hidden transition-all duration-300
      bg-white/5 backdrop-blur-xl border border-white/10
      hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]
      ${wide ? 'xl:col-span-2' : ''}`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className={`absolute inset-0 ${c.glow}`} />
      </div>
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1 text-white tracking-tight">{value}</p>
          {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0
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

  const activos = jugadores.filter(j => (j.activo || '').toUpperCase() === 'SI');

  // Set de cédulas morosas para lookup rápido
  const morososSet = new Set(morosos.map(m => String(m.cedula)));

  // Calcular estado por jugador (mutuamente excluyente → suman 31)
  let countAlDia = 0, countPendientes = 0, countParciales = 0, countMora = 0;

  activos.forEach(j => {
    const cedula = String(j.cedula);

    // Prioridad 1: tiene deuda histórica → MORA
    if (morososSet.has(cedula)) {
      countMora++;
      return;
    }

    // Prioridad 2: buscar factura del mes actual
    const invMesActual = mensualidades.find(
      m => String(m.cedula) === cedula && parseInt(m.numero_mes) === mesActual
    );

    if (!invMesActual || invMesActual.estado === 'AL_DIA') {
      countAlDia++;      // sin registro este mes o ya pagó → al día
    } else if (invMesActual.estado === 'PARCIAL') {
      countParciales++;
    } else if (invMesActual.estado === 'PENDIENTE') {
      countPendientes++;
    } else {
      countAlDia++;
    }
  });

  // Recaudado sobre todas las mensualidades del año
  const recaudado     = mensualidades.reduce((s, m) => s + (parseFloat(m.valor_pagado)  || 0), 0);
  const totalEsperado = mensualidades.reduce((s, m) => s + (parseFloat(m.valor_oficial) || 0), 0);

  const pctAlDia = activos.length > 0
    ? Math.round((countAlDia / activos.length) * 100)
    : 0;

  const formatCOP = n =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
      <StatCard icon={Users}         label="Jugadores"  value={activos.length}   subtext="Activos"              color="blue"   />
      <StatCard icon={CheckCircle}   label="Al Día"     value={countAlDia}       subtext={`${pctAlDia}%`}       color="green"  />
      <StatCard icon={Clock}         label="Pendientes" value={countPendientes}  subtext="Por cobrar"           color="yellow" />
      <StatCard icon={XCircle}       label="En Mora"    value={countMora}        subtext={`${countMora} jugadores`} color="red" />
      <StatCard icon={AlertTriangle} label="Parciales"  value={countParciales}   subtext="Abonos"               color="purple" />
      <StatCard icon={DollarSign}    label="Recaudado"  value={formatCOP(recaudado)} subtext={`de ${formatCOP(totalEsperado)}`} color="green" wide />
    </div>
  );
}
