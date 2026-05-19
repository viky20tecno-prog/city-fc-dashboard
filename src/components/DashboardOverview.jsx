import { useMemo } from 'react';
import {
  Users, CheckCircle, Clock, XCircle, AlertTriangle, DollarSign,
} from 'lucide-react';
import RecaudacionChart from './RecaudacionChart';
import MorososList from './MorososList';
import { formatMoney, getCodigoPais } from '../lib/formatMoney';

/* ── formateo ── */
const formatCOP = (n) => formatMoney(n, getCodigoPais());

/* ── KPI card ── */
const COLORS = {
  blue:   { icon: '#60A5FA', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)',   glow: 'rgba(96,165,250,0.12)'   },
  green:  { icon: '#22C55E', bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.2)',    glow: 'rgba(34,197,94,0.12)'    },
  yellow: { icon: '#F59E0B', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)',   glow: 'rgba(245,158,11,0.12)'   },
  red:    { icon: '#EF4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)',    glow: 'rgba(239,68,68,0.12)'    },
  purple: { icon: '#C678FF', bg: 'rgba(198,120,255,0.08)',  border: 'rgba(198,120,255,0.2)',  glow: 'rgba(198,120,255,0.12)'  },
  gold:   { icon: '#B68631', bg: 'rgba(182,134,49,0.08)',   border: 'rgba(182,134,49,0.2)',   glow: 'rgba(182,134,49,0.12)'   },
};

function KpiCard({ icon: Icon, label, value, sub, color = 'blue', colorObj, delay = 0, wide }) {
  const c = colorObj || COLORS[color];
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${c.border}`,
      borderRadius: '14px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
      animation: `kpi-in 0.45s ease ${delay}s both`,
      transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
      gridColumn: wide ? 'span 2' : undefined,
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent, ${c.border} 40%, transparent)`,
        pointerEvents: 'none',
      }} />
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 20% 50%, ${c.glow} 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.bg, border: `1px solid ${c.border}`,
        position: 'relative',
      }}>
        <Icon size={22} color={c.icon} strokeWidth={1.8} />
      </div>

      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: '6px', fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '38px', lineHeight: 1, color: 'var(--text-pri)', letterSpacing: '1px' }}>
          {value}
        </div>
        {sub != null && (
          <div style={{ fontSize: '11px', color: 'var(--text-mut)', marginTop: '5px' }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

/* ── componente principal ── */
export default function DashboardOverview({ jugadores, mensualidades, morosos, codigoPais = '57', color = '#60A5FA', clubNombre = 'Mi Club', logoUrl = '' }) {
  const mesActual = new Date().getMonth() + 1;

  const activos = useMemo(
    () => jugadores.filter(j => j.activo === true || (j.activo || '').toString().toUpperCase() === 'SI'),
    [jugadores],
  );

  const morososSet = useMemo(
    () => new Set(morosos.map(m => String(m.cedula))),
    [morosos],
  );

  const stats = useMemo(() => {
    let alDia = 0, pendientes = 0, parciales = 0, mora = 0;
    activos.forEach(j => {
      const ced = String(j.cedula);
      if (morososSet.has(ced)) { mora++; return; }
      const inv = mensualidades.find(
        m => String(m.cedula) === ced && parseInt(m.numero_mes) === mesActual,
      );
      if (!inv || inv.estado === 'AL_DIA') alDia++;
      else if (inv.estado === 'PARCIAL')   parciales++;
      else if (inv.estado === 'PENDIENTE') pendientes++;
      else alDia++;
    });
    const recaudado     = mensualidades.reduce((s, m) => s + (parseFloat(m.valor_pagado)  || 0), 0);
    const totalEsperado = mensualidades.reduce((s, m) => s + (parseFloat(m.valor_oficial) || 0), 0);
    const pct = activos.length > 0 ? Math.round((alDia / activos.length) * 100) : 0;
    return { alDia, pendientes, parciales, mora, recaudado, totalEsperado, pct };
  }, [activos, morososSet, mensualidades, mesActual]);

  const clubColor = {
    icon:   color,
    bg:     `${color}14`,
    border: `${color}33`,
    glow:   `${color}18`,
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── 6 KPI CARDS ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr) repeat(3, 1fr)',
        gap: '12px',
      }}>
        <KpiCard icon={Users}         label="Jugadores"  value={activos.length}          sub="Activos"                          colorObj={clubColor} delay={0.05} />
        <KpiCard icon={CheckCircle}   label="Al Día"     value={stats.alDia}             sub={`${stats.pct}%`}                  color="green"  delay={0.10} />
        <KpiCard icon={Clock}         label="Pendientes" value={stats.pendientes}         sub="Por cobrar"                       color="yellow" delay={0.15} />
        <KpiCard icon={XCircle}       label="En Mora"    value={stats.mora}              sub={`${stats.mora} jugadores`}        color="red"    delay={0.20} />
        <KpiCard icon={AlertTriangle} label="Parciales"  value={stats.parciales}         sub="Abonos"                           color="purple" delay={0.25} />
        <KpiCard
          icon={DollarSign}
          label="Recaudado"
          value={formatCOP(stats.recaudado)}
          sub={`de ${formatCOP(stats.totalEsperado)}`}
          color="gold"
          delay={0.30}
        />
      </div>

      {/* ── GRÁFICA + MOROSOS ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        alignItems: 'start',
      }}>
        <RecaudacionChart mensualidades={mensualidades} />
        <MorososList morosos={morosos} codigoPais={codigoPais} clubNombre={clubNombre} color={color} logoUrl={logoUrl} />
      </div>

    </div>
  );
}
