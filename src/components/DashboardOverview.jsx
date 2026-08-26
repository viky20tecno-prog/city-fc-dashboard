import { useMemo, useState, useEffect } from 'react';
import {
  Users, CheckCircle, Clock, XCircle, AlertTriangle, DollarSign, ChevronDown,
} from 'lucide-react';
import RecaudacionChart from './RecaudacionChart';
import MorososList from './MorososList';
import PagosPendientesList from './PagosPendientesList';
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

function KpiCard({ icon: Icon, label, value, sub, color = 'blue', colorObj, delay = 0, wide, onClick, active, isMobile }) {
  const c = colorObj || COLORS[color];
  const pad    = isMobile ? '12px' : '20px';
  const gap    = isMobile ? '10px' : '16px';
  const icoSz  = isMobile ? 34 : 48;
  const icoR   = isMobile ? '8px' : '12px';
  const iconSz = isMobile ? 15 : 22;
  const lblSz  = isMobile ? '9px' : '11px';
  const subSz  = isMobile ? '9px' : '11px';
  // Reducir fuente si el valor es largo (montos formateados, ej: "$ 8.710.000")
  const valLen = String(value).replace(/\s/g, '').length;
  const numSz  = valLen > 9
    ? (isMobile ? '15px' : '20px')
    : valLen > 6
      ? (isMobile ? '18px' : '28px')
      : (isMobile ? '24px' : '38px');
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${active ? c.icon : c.border}`,
        borderRadius: '14px',
        padding: pad,
        display: 'flex',
        alignItems: 'center',
        gap,
        position: 'relative',
        overflow: 'hidden',
        animation: `kpi-in 0.45s ease ${delay}s both`,
        transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
        gridColumn: wide ? 'span 2' : undefined,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 2px ${c.icon}40, 0 4px 16px ${c.glow}` : undefined,
        transform: active ? 'translateY(-1px)' : undefined,
      }}
    >
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
        width: `${icoSz}px`, height: `${icoSz}px`, borderRadius: icoR, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.bg, border: `1px solid ${c.border}`,
        position: 'relative',
      }}>
        <Icon size={iconSz} color={c.icon} strokeWidth={1.8} />
      </div>

      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ fontSize: lblSz, letterSpacing: isMobile ? '0.8px' : '1.5px', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: isMobile ? '3px' : '6px', fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: numSz, lineHeight: 1, color: 'var(--text-pri)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </div>
        {sub != null && (
          <div style={{ fontSize: subSz, color: 'var(--text-mut)', marginTop: isMobile ? '2px' : '5px' }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

/* ── panel al día ── */
function AlDiaPanel({ jugadores }) {
  if (!jugadores.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: '14px', padding: '20px',
      border: `1px solid rgba(34,197,94,0.3)`,
      boxShadow: '0 0 0 1px rgba(34,197,94,0.12)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <CheckCircle size={15} color="#22C55E" />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-pri)' }}>Al día este mes</span>
        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
          {jugadores.length}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
        {jugadores.map(j => (
          <div key={j.cedula} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <CheckCircle size={11} color="#22C55E" strokeWidth={2.5} />
            <span style={{ fontSize: '12px', color: 'var(--text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(j.nombre || '').toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── empty state ── */
function EmptyDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--cc12)', border: '1px solid var(--cc20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Users size={32} color="var(--cc)" strokeWidth={1.3} />
      </div>
      <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: '26px', letterSpacing: '-0.3px', color: 'var(--text-sec)' }}>
        Sin jugadores registrados
      </div>
      <div style={{ color: 'var(--text-mut)', fontSize: '14px', lineHeight: 1.7, maxWidth: 320 }}>
        Agrega tu primer jugador para ver estadísticas de pagos, morosos y recaudación del mes.
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
        <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--cc12)', border: '1px solid var(--cc20)', color: 'var(--cc)', fontSize: '12px', fontWeight: 500 }}>
          Usa "Jugadores" → Importar CSV
        </div>
        <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-sub)', color: 'var(--text-sec)', fontSize: '12px' }}>
          o comparte el link de Inscripción
        </div>
      </div>
    </div>
  );
}

/* ── componente principal ── */
export default function DashboardOverview({ jugadores, mensualidades, morosos, suspensiones = [], valorMensualidad = 0, codigoPais = '57', color = '#60A5FA', clubNombre = 'Mi Club', logoUrl = '' }) {
  const mensualidadConfigurada = Number(valorMensualidad) > 0;
  const mesActual  = new Date().getMonth() + 1;
  const anioActual = new Date().getFullYear();

  const [activeKpi, setActiveKpi] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  const kpiToggle = (key) => setActiveKpi(prev => prev === key ? null : key);

  const activos = useMemo(
    () => jugadores.filter(j => j.activo === true || (j.activo || '').toString().toUpperCase() === 'SI'),
    [jugadores],
  );

  const morososSet = useMemo(
    () => new Set(morosos.map(m => String(m.cedula))),
    [morosos],
  );

  // Solo suspensiones ACTIVAS excusan un mes (si se cancela, la deuda vuelve a contar) —
  // se consulta la tabla suspensiones directo en vez de confiar en el string `estado` de
  // la mensualidad, que puede quedar desincronizado tras cancelar/crear una suspensión.
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

  const { stats, alDiaList } = useMemo(() => {
    let alDia = 0, pendientes = 0, parciales = 0, mora = 0;
    const alDiaArr = [];
    // Sin valor_mensualidad configurado no hay deuda real que reportar — no marcar
    // a nadie como pendiente/mora/al día hasta que el club configure el cobro.
    if (!mensualidadConfigurada) {
      return { stats: { alDia: 0, pendientes: 0, parciales: 0, mora: 0, recaudado: 0, totalEsperado: 0, pct: 0 }, alDiaList: [] };
    }
    activos.forEach(j => {
      const ced = String(j.cedula);
      if (esSuspendido(ced, mesActual)) {
        alDia++;
        alDiaArr.push({ nombre: `${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase(), cedula: j.cedula });
        return;
      }
      if (morososSet.has(ced)) { mora++; return; }
      const inv = mensualidades.find(
        m => String(m.cedula) === ced &&
             parseInt(m.numero_mes) === mesActual &&
             parseInt(m.anio)       === anioActual,
      );
      if (!inv || inv.estado === 'AL_DIA') {
        alDia++;
        alDiaArr.push({ nombre: `${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase(), cedula: j.cedula });
      } else if (inv.estado === 'PARCIAL')   parciales++;
      else if (inv.estado === 'PENDIENTE') pendientes++;
      else { alDia++; alDiaArr.push({ nombre: `${j.nombre || ''} ${j.apellidos || ''}`.trim(), cedula: j.cedula }); }
    });
    const recaudado     = mensualidades.reduce((s, m) => s + (parseFloat(m.valor_pagado) || 0), 0);
    const totalEsperado = mensualidades.reduce((s, m) => {
      if (esSuspendido(m.cedula, parseInt(m.numero_mes))) return s;
      return s + (parseFloat(m.valor_oficial) || 0);
    }, 0);
    const pct = activos.length > 0 ? Math.round((alDia / activos.length) * 100) : 0;
    return { stats: { alDia, pendientes, parciales, mora, recaudado, totalEsperado, pct }, alDiaList: alDiaArr };
  }, [activos, morososSet, mensualidades, mesActual, anioActual, esSuspendido, mensualidadConfigurada]);

  const pendientesList = useMemo(() => {
    if (!mensualidadConfigurada) return [];
    return activos
      .map(j => {
        const ced = String(j.cedula);
        // Excluir morosos: el KPI ya los cuenta en MORA, no duplicar en PENDIENTES
        if (morososSet.has(ced)) return null;
        if (esSuspendido(ced, mesActual)) return null;
        const mens = mensualidades.find(
          m => String(m.cedula) === ced &&
               parseInt(m.numero_mes) === mesActual &&
               parseInt(m.anio) === anioActual,
        );
        if (j.descuento_pct >= 100) return null;
        if (!mens || ['AL_DIA', 'MORA', 'EXENTO', 'SUSPENDIDO'].includes(mens.estado)) return null;
        return {
          nombre:   `${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase(),
          cedula:   j.cedula,
          celular:  j.celular,
          equipo:   j.equipo || '',
          saldo:    parseFloat(mens.saldo_pendiente) || parseFloat(mens.valor_oficial) || 0,
          estado:   mens.estado,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.saldo - a.saldo);
  }, [activos, morososSet, mensualidades, mesActual, anioActual, esSuspendido, mensualidadConfigurada]);

  // Conteo de morosos que también tienen cuota del mes sin pagar (info para el admin)
  const morososConCuotaMes = useMemo(() => {
    return morosos.filter(m => {
      const mens = mensualidades.find(
        inv => String(inv.cedula) === String(m.cedula) &&
               parseInt(inv.numero_mes) === mesActual &&
               parseInt(inv.anio) === anioActual,
      );
      return mens && !['AL_DIA'].includes(mens.estado);
    }).length;
  }, [morosos, mensualidades, mesActual, anioActual]);

  const pendientesFiltered = useMemo(() => {
    if (activeKpi === 'parciales')   return pendientesList.filter(p => p.estado === 'PARCIAL');
    if (activeKpi === 'pendientes') return pendientesList.filter(p => p.estado === 'PENDIENTE');
    return pendientesList;
  }, [pendientesList, activeKpi]);

  const clubColor = {
    icon:   color,
    bg:     `${color}14`,
    border: `${color}33`,
    glow:   `${color}18`,
  };

  if (jugadores.length === 0) return <EmptyDashboard />;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── 6 KPI CARDS ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr) repeat(3, 1fr)',
        gap: '10px',
      }}>
        <KpiCard icon={Users}         label="Jugadores"  value={activos.length}   sub="Activos"                  colorObj={clubColor} delay={0.05} isMobile={isMobile} />
        <KpiCard icon={CheckCircle}   label="Al Día"     value={stats.alDia}      sub={`${stats.pct}%`}          color="green"  delay={0.10} isMobile={isMobile}
          onClick={() => kpiToggle('aldia')} active={activeKpi === 'aldia'} />
        <KpiCard icon={Clock}         label="Pendientes" value={stats.pendientes} sub="Por cobrar"               color="yellow" delay={0.15} isMobile={isMobile}
          onClick={() => kpiToggle('pendientes')} active={activeKpi === 'pendientes'} />
        <KpiCard icon={XCircle}       label="En Mora"    value={stats.mora}       sub={`${stats.mora} jugadores`} color="red"   delay={0.20} isMobile={isMobile}
          onClick={() => kpiToggle('mora')} active={activeKpi === 'mora'} />
        <KpiCard icon={AlertTriangle} label="Parciales"  value={stats.parciales}  sub="Abonos"                   color="purple" delay={0.25} isMobile={isMobile}
          onClick={() => kpiToggle('parciales')} active={activeKpi === 'parciales'} />
        <KpiCard
          icon={DollarSign}
          label="Recaudado"
          value={formatCOP(stats.recaudado)}
          sub={`de ${formatCOP(stats.totalEsperado)}`}
          color="gold"
          delay={0.30}
          isMobile={isMobile}
        />
      </div>

      {/* ── HINT cuando ningún KPI está activo ── */}
      {!activeKpi && (
        <div style={{ fontSize: '11px', color: 'var(--text-mut)', textAlign: 'center', letterSpacing: '0.5px' }}>
          Toca un KPI para ver el detalle
        </div>
      )}

      {/* ── DRILL-DOWN: Al Día ── */}
      {activeKpi === 'aldia' && <AlDiaPanel jugadores={alDiaList} color={color} />}

      {/* ── GRÁFICA + MOROSOS ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: '16px',
        alignItems: 'start',
      }}>
        <RecaudacionChart mensualidades={mensualidades} suspensiones={suspensiones} />
        <div style={{
          borderRadius: '16px',
          outline: activeKpi === 'mora' ? `2px solid rgba(239,68,68,0.5)` : 'none',
          outlineOffset: '2px',
          transition: 'outline 0.2s',
        }}>
          <MorososList morosos={morosos} codigoPais={codigoPais} clubNombre={clubNombre} color={color} logoUrl={logoUrl} />
        </div>
      </div>

      {/* ── PAGOS PENDIENTES ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: '16px',
        outline: (activeKpi === 'pendientes' || activeKpi === 'parciales') ? `2px solid rgba(245,158,11,0.5)` : 'none',
        outlineOffset: '2px',
        transition: 'outline 0.2s',
      }}>
        <PagosPendientesList
          pendientes={pendientesFiltered}
          codigoPais={codigoPais}
          clubNombre={clubNombre}
          color={color}
          logoUrl={logoUrl}
          filtroLabel={activeKpi === 'pendientes' ? 'Pendiente' : activeKpi === 'parciales' ? 'Parcial' : null}
          morososConCuotaMes={morososConCuotaMes}
        />
      </div>

    </div>
  );
}
