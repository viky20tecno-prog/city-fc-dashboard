import { useMemo } from 'react';
import { Users, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const fmtK = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

/* ── helpers de estilo reutilizables ── */

function topLine() {
  return {
    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(225,73,36,0.45) 40%, rgba(182,134,49,0.3) 60%, transparent)',
    pointerEvents: 'none',
  };
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#1E1E1E',
      border: '1px solid rgba(225,73,36,0.22)',
      borderRadius: '10px',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.3s, border-color 0.3s',
      ...style,
    }}>
      <div style={topLine()} />
      {/* bottom-right corner accent */}
      <div style={{
        position: 'absolute', bottom: '8px', right: '8px',
        width: '12px', height: '12px',
        borderRight: '1px solid rgba(225,73,36,0.3)',
        borderBottom: '1px solid rgba(225,73,36,0.3)',
        borderRadius: '0 0 3px 0',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  );
}

function CardHead({ title, badge, gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <div style={{
        width: '3px', height: '15px', flexShrink: 0,
        background: gold ? '#B68631' : '#E14924',
        borderRadius: '2px',
        boxShadow: gold ? '0 0 8px rgba(182,134,49,0.7)' : '0 0 8px rgba(225,73,36,0.7)',
      }} />
      <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '14px', letterSpacing: '2.5px', color: '#fff' }}>
        {title}
      </span>
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: '9px', letterSpacing: '1.5px',
          color: '#7A7A7A', textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '2px 7px', borderRadius: '20px',
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, isGold, delay }) {
  return (
    <div style={{
      background: '#1E1E1E',
      border: '1px solid rgba(225,73,36,0.22)',
      borderRadius: '10px',
      padding: '16px',
      display: 'flex', alignItems: 'center', gap: '14px',
      position: 'relative', overflow: 'hidden',
      animation: `kpi-in 0.5s ease ${delay}s both`,
      cursor: 'default', transition: 'all 0.3s',
    }}>
      <div style={topLine()} />
      {/* top-left corner accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '12px', height: '12px',
        borderTop: '1px solid rgba(225,73,36,0.4)',
        borderLeft: '1px solid rgba(225,73,36,0.4)',
        borderRadius: '3px 0 0 0',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '46px', height: '46px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: isGold ? 'rgba(182,134,49,0.1)' : 'rgba(225,73,36,0.1)',
        border: `1px solid ${isGold ? 'rgba(182,134,49,0.2)' : 'rgba(225,73,36,0.2)'}`,
      }}>
        <Icon size={20} color={isGold ? '#B68631' : '#E14924'} strokeWidth={1.7} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#7A7A7A', marginBottom: '5px' }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: '36px', lineHeight: 1,
          color: isGold ? '#B68631' : '#fff',
          textShadow: isGold ? '0 0 14px rgba(182,134,49,0.4)' : 'none',
        }}>
          {value}
        </div>
        {sub != null && (
          <div style={{ fontSize: '10px', color: '#7A7A7A', marginTop: '4px' }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

function LegendPip({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#7A7A7A' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1A1A1A', border: '1px solid rgba(225,73,36,0.35)',
      borderRadius: '8px', padding: '10px', fontSize: '12px', minWidth: '140px',
    }}>
      <p style={{ color: '#fff', fontWeight: 600, marginBottom: '6px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#7A7A7A', marginTop: '2px' }}>
          {p.name}: {fmtK(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ── componente principal ── */

export default function DashboardOverview({ jugadores, mensualidades, morosos }) {
  const mesActualIdx = new Date().getMonth();
  const mesActual    = mesActualIdx + 1;

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
    const recaudado = mensualidades.reduce((s, m) => s + (parseFloat(m.valor_pagado) || 0), 0);
    const pct = activos.length > 0 ? Math.round((alDia / activos.length) * 100) : 0;
    return { alDia, pendientes, parciales, mora, recaudado, pct };
  }, [activos, morososSet, mensualidades, mesActual]);

  /* datos por mes para gráfica de área */
  const monthData = useMemo(() => {
    const meses = MESES_SHORT.map((m, i) => ({ mes: m, idx: i, pagado: 0, pendiente: 0 }));
    mensualidades.forEach(m => {
      const nombre = (m.mes || '').charAt(0).toUpperCase() + (m.mes || '').slice(1).toLowerCase();
      const idx    = MESES_FULL.indexOf(nombre);
      if (idx < 0 || idx > mesActualIdx + 1) return;
      meses[idx].pagado    += parseFloat(m.valor_pagado)    || 0;
      meses[idx].pendiente += parseFloat(m.saldo_pendiente) || 0;
    });
    return meses.slice(0, mesActualIdx + 2);
  }, [mensualidades, mesActualIdx]);

  /* últimos 4 meses para actividad financiera */
  const finData = monthData.slice(-4);

  /* distribución del plantel */
  const donutData = [
    { name: 'Al Día',    value: stats.alDia,      color: '#E14924' },
    { name: 'En Mora',   value: stats.mora,        color: '#2A3495' },
    { name: 'Pendiente', value: stats.pendientes,  color: '#B68631' },
    { name: 'Parcial',   value: stats.parciales,   color: '#3DAB78' },
  ].filter(d => d.value > 0);

  /* últimas mensualidades con pago registrado */
  const ultimosPagos = useMemo(() => {
    return [...mensualidades]
      .filter(m => parseFloat(m.valor_pagado) > 0)
      .slice(-5)
      .reverse();
  }, [mensualidades]);

  const getNombre = (cedula) =>
    jugadores.find(j => String(j.cedula) === String(cedula))?.nombre || cedula;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <KpiCard
          icon={Users} label="Jugadores Activos" value={activos.length}
          sub={<><span style={{ color: '#E14924', fontWeight: 600 }}>●</span> Plantel completo</>}
          delay={0.05}
        />
        <KpiCard
          icon={CheckCircle} label="Al Día Este Mes" value={stats.alDia}
          sub={<><span style={{ color: '#22C55E', fontWeight: 600 }}>{stats.pct}%</span> del plantel</>}
          delay={0.10}
        />
        <KpiCard
          icon={DollarSign} label="Recaudado" value={fmtK(stats.recaudado)}
          sub="Acumulado anual" isGold delay={0.15}
        />
        <KpiCard
          icon={AlertTriangle} label="En Mora" value={stats.mora}
          sub={<><span style={{ color: '#E14924', fontWeight: 600 }}>{stats.pendientes}</span> pendientes</>}
          delay={0.20}
        />
      </div>

      {/* ── centro: área + donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px' }}>

        {/* Gráfica de área — recaudación */}
        <Card>
          <CardHead title="Recaudación de Temporada" badge={`${monthData.length} meses`} />
          <div style={{ height: '195px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthData} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ovGradPagado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#E14924" stopOpacity={0.45} />
                    <stop offset="60%"  stopColor="#E14924" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#E14924" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ovGradPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#B68631" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#B68631" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#5A5A5A' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 9, fill: '#5A5A5A' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Area
                  type="monotone" dataKey="pagado" name="Pagado"
                  stroke="#E14924" strokeWidth={2.2} fill="url(#ovGradPagado)"
                  dot={{ fill: '#E14924', stroke: '#161616', strokeWidth: 1.5, r: 3.5 }}
                  activeDot={{ r: 5.5 }}
                />
                <Area
                  type="monotone" dataKey="pendiente" name="Pendiente"
                  stroke="#B68631" strokeWidth={2} fill="url(#ovGradPend)"
                  dot={{ fill: '#B68631', stroke: '#161616', strokeWidth: 1.5, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: '10px' }}>
            <LegendPip color="#E14924" label="Pagado" />
            <LegendPip color="#B68631" label="Pendiente" />
          </div>
        </Card>

        {/* Donut — distribución */}
        <Card>
          <CardHead title="Distribución del Plantel" gold />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '190px' }}>
            <ResponsiveContainer width={190} height={190}>
              <PieChart>
                <Pie
                  data={donutData.length ? donutData : [{ name: 'Sin datos', value: 1, color: '#2A2A2A' }]}
                  cx="50%" cy="50%"
                  innerRadius="70%" outerRadius="88%"
                  startAngle={90} endAngle={-270}
                  dataKey="value" strokeWidth={0}
                >
                  {(donutData.length ? donutData : [{ color: '#2A2A2A' }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="#1E1E1E" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(225,73,36,0.35)', borderRadius: '8px', padding: '8px 10px', fontSize: '12px' }}
                  itemStyle={{ color: '#7A7A7A' }}
                  formatter={(value, name) => [`${value} jugadores`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '30px', lineHeight: 1, color: '#fff' }}>
                {activos.length}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A7A7A' }}>
                Jugadores
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: '10px' }}>
            {donutData.map((d, i) => (
              <LegendPip key={i} color={d.color} label={`${d.name} (${d.value})`} />
            ))}
          </div>
        </Card>
      </div>

      {/* ── fila inferior ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

        {/* Últimos pagos */}
        <Card>
          <CardHead title="Últimos Pagos" badge="Últ. 5" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {ultimosPagos.length === 0 ? (
              <div style={{ color: '#7A7A7A', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
                Sin pagos registrados
              </div>
            ) : ultimosPagos.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 11px',
                background: 'rgba(255,255,255,0.025)',
                borderRadius: '7px',
                border: '1px solid transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '7px',
                  fontSize: '11px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: 'rgba(34,197,94,0.12)', color: '#22C55E',
                  border: '1px solid rgba(34,197,94,0.25)',
                  boxShadow: '0 0 8px rgba(34,197,94,0.15)',
                }}>
                  ✓
                </div>
                <div style={{
                  fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)',
                  flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {getNombre(m.cedula)}
                </div>
                <div style={{
                  fontFamily: "'Bebas Neue', cursive", fontSize: '15px', flexShrink: 0,
                  color: '#22C55E', textShadow: '0 0 8px rgba(34,197,94,0.5)',
                  letterSpacing: '1px',
                }}>
                  {fmtK(parseFloat(m.valor_pagado) || 0)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Estado del plantel */}
        <Card>
          <CardHead title="Estado del Plantel" badge="Resumen" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                {['Estado', 'Jug.', '%'].map((h, i) => (
                  <th key={i} style={{
                    color: '#7A7A7A', fontSize: '9px', letterSpacing: '2px',
                    textTransform: 'uppercase', fontWeight: 500,
                    padding: '5px 8px', textAlign: i === 0 ? 'left' : 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: '★ Al Día',   count: stats.alDia,     highlight: true  },
                { label: 'Pendiente',  count: stats.pendientes, highlight: false },
                { label: 'Parcial',    count: stats.parciales,  highlight: false },
                { label: 'En Mora',    count: stats.mora,       highlight: false },
              ].map((row, i) => {
                const pct = activos.length > 0 ? Math.round((row.count / activos.length) * 100) : 0;
                return (
                  <tr key={i} style={{ background: row.highlight ? 'rgba(225,73,36,0.1)' : 'transparent' }}>
                    <td style={{
                      padding: '8px 8px', textAlign: 'left',
                      color: row.highlight ? '#E14924' : 'rgba(255,255,255,0.75)',
                      fontWeight: row.highlight ? 700 : 500,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>{row.label}</td>
                    <td style={{
                      padding: '8px 8px', textAlign: 'center',
                      color: row.highlight ? '#fff' : '#7A7A7A',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontFamily: "'Bebas Neue', cursive", fontSize: '15px', letterSpacing: '1px',
                    }}>{row.count}</td>
                    <td style={{
                      padding: '8px 8px', textAlign: 'center',
                      color: row.highlight ? '#E14924' : '#7A7A7A',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontFamily: "'Bebas Neue', cursive", fontSize: '15px',
                      textShadow: row.highlight ? '0 0 10px rgba(225,73,36,0.5)' : 'none',
                    }}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Actividad financiera */}
        <Card>
          <CardHead title="Actividad Financiera" badge="Últ. 4 meses" />
          <div style={{ height: '172px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis
                  type="number" tickFormatter={fmtK}
                  tick={{ fontSize: 9, fill: '#5A5A5A' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="mes"
                  tick={{ fontSize: 11, fill: '#8A8A8A' }}
                  axisLine={false} tickLine={false} width={28}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="pagado"    name="Pagado"    fill="rgba(225,73,36,0.65)"  radius={[0, 4, 4, 0]} />
                <Bar dataKey="pendiente" name="Pendiente" fill="rgba(42,52,149,0.65)"  radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
            <LegendPip color="#E14924" label="Pagado" />
            <LegendPip color="#2A3495" label="Pendiente" />
          </div>
        </Card>

      </div>
    </div>
  );
}
