import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// % de jugadores en mora al cierre de cada mes, reconstruido en la API con la fecha real
// de los pagos (GET /reports/evolucion-mora). Si la API dice que la reconstrucción no es
// confiable (pagos que no cuadran con las mensualidades, p.ej. estados importados de
// Excel), la gráfica no se muestra: mejor nada que una mora inventada.

function getCC() {
  if (typeof window === 'undefined') return '#E14924';
  return getComputedStyle(document.documentElement).getPropertyValue('--cc').trim() || '#E14924';
}

function MoraTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-sub)',
      borderRadius: 10, padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-pri)', fontWeight: 600, margin: '0 0 4px' }}>Cierre de {d.mes}</p>
      <p style={{ color: 'var(--text-sec)', margin: 0 }}>
        {d.morosos} de {d.total} jugadores en mora · <strong style={{ color: 'var(--text-pri)' }}>{d.porcentaje}%</strong>
      </p>
    </div>
  );
}

export function EvolucionMoraView({ evolucion }) {
  const meses = evolucion?.meses || [];
  if (!evolucion?.confiable || meses.length < 2) return null;

  const cc = getCC();
  const inicio = meses[0].porcentaje;
  const fin = meses[meses.length - 1].porcentaje;
  const bajo = fin < inicio;
  const tendencia = bajo ? '#22C55E' : fin > inicio ? '#EF4444' : 'var(--text-sec)';
  const data = meses.map(m => ({ ...m, corto: m.mes.substring(0, 3) }));

  return (
    <div style={{
      position: 'relative', background: 'var(--bg-card)', borderRadius: 16,
      border: `1px solid ${cc}22`, padding: 24, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-pri)', letterSpacing: '-0.2px', margin: 0 }}>
            Evolución de la mora
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text-mut)', marginTop: 2 }}>
            % de jugadores en mora al cierre de cada mes · {evolucion.anio || new Date().getFullYear()}
          </p>
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
          background: bajo ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
          border: `1px solid ${bajo ? 'rgba(34,197,94,0.3)' : 'var(--border-sub)'}`,
          color: tendencia,
        }}>
          {`${inicio}% → ${fin}%`}
        </div>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gradMora" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tendencia} stopOpacity={0.35} />
                <stop offset="100%" stopColor={tendencia} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-sub)" vertical={false} />
            <XAxis dataKey="corto" tick={{ fill: 'var(--text-mut)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fill: 'var(--text-mut)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<MoraTooltip />} />
            <Area type="monotone" dataKey="porcentaje" stroke={tendencia} strokeWidth={2.5}
              fill="url(#gradMora)" dot={{ r: 3, fill: tendencia }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
