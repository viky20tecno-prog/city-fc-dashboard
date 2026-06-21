import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Trophy } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { authFetch } from '../../lib/authFetch';
import { getClubId } from '../../services/api';

const ESTADOS = {
  PRESENTE:    { label: 'Presente',    color: '#22C55E', bg: '#22C55E15', Icon: CheckCircle2 },
  AUSENTE:     { label: 'Ausente',     color: '#EF4444', bg: '#EF444415', Icon: XCircle      },
  JUSTIFICADO: { label: 'Justificado', color: '#F59E0B', bg: '#F59E0B15', Icon: AlertCircle  },
  PENDIENTE:   { label: 'Pendiente',   color: '#6B7280', bg: 'transparent', Icon: null       },
};

const pad2 = n => String(n).padStart(2, '0');
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function fmtFecha(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtHora(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function CircleProgress({ pct, color, size = 80 }) {
  const r  = (size - 10) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct != null ? (pct / 100) * circ : 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--bg-surface)" strokeWidth={8} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

export default function TabAsistencia({ jugador }) {
  const clubId = getClubId();
  const [historial, setHistorial]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [filtro,    setFiltro]      = useState('TODOS');

  useEffect(() => {
    setLoading(true);
    authFetch(`${API_BASE_URL}/asistencia/jugador/${jugador.cedula}?club_id=${clubId}`)
      .then(r => r.json())
      .then(d => setHistorial(d.data || []))
      .catch(() => setHistorial([]))
      .finally(() => setLoading(false));
  }, [jugador.cedula, clubId]);

  const stats = useMemo(() => {
    const s = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0, PENDIENTE: 0, total: 0 };
    historial.forEach(h => { s[h.estado] = (s[h.estado] || 0) + 1; s.total++; });
    const marcados = s.PRESENTE + s.AUSENTE + s.JUSTIFICADO;
    return { ...s, marcados, pct: marcados > 0 ? Math.round((s.PRESENTE / marcados) * 100) : null };
  }, [historial]);

  const pctColor = stats.pct == null ? '#6B7280'
    : stats.pct >= 75 ? '#22C55E'
    : stats.pct >= 50 ? '#F59E0B'
    : '#EF4444';

  const filtrados = filtro === 'TODOS' ? historial : historial.filter(h => h.estado === filtro);

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-2 text-[var(--text-sec)]">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">Cargando historial…</span>
    </div>
  );

  if (historial.length === 0) return (
    <div className="text-center py-20">
      <CheckCircle2 size={40} className="mx-auto mb-3 opacity-20 text-[var(--text-sec)]" />
      <p className="text-sm text-[var(--text-sec)]">Sin registros de asistencia aún</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Resumen visual */}
      <div className="flex items-center gap-5 p-4 rounded-2xl border border-[var(--border-sub)] bg-[var(--bg-surface)]">
        <div className="relative flex-shrink-0">
          <CircleProgress pct={stats.pct} color={pctColor} size={80} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black leading-none" style={{ color: pctColor }}>
              {stats.pct != null ? `${stats.pct}%` : '—'}
            </span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          {[
            { label: 'Presentes',    val: stats.PRESENTE,    color: '#22C55E' },
            { label: 'Ausentes',     val: stats.AUSENTE,     color: '#EF4444' },
            { label: 'Justificados', val: stats.JUSTIFICADO, color: '#F59E0B' },
            { label: 'Eventos',      val: stats.marcados,    color: 'var(--text-sec)' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <p className="text-lg font-bold leading-none" style={{ color }}>{val}</p>
              <p className="text-[10px] text-[var(--text-mut)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Incentivo */}
      {stats.pct != null && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{
            background: stats.pct >= 75 ? '#22C55E15' : stats.pct >= 50 ? '#F59E0B15' : '#EF444415',
            color:      stats.pct >= 75 ? '#22C55E'   : stats.pct >= 50 ? '#F59E0B'   : '#EF4444',
            border:     `1px solid ${stats.pct >= 75 ? '#22C55E30' : stats.pct >= 50 ? '#F59E0B30' : '#EF444430'}`,
          }}>
          <Trophy size={13} />
          {stats.pct >= 90 ? 'Excelente asistencia — candidato a incentivo ⭐'
            : stats.pct >= 75 ? 'Buena asistencia — sigue así'
            : stats.pct >= 50 ? 'Asistencia regular — puede mejorar'
            : 'Asistencia baja — requiere atención'}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {['TODOS', 'PRESENTE', 'AUSENTE', 'JUSTIFICADO'].map(f => {
          const active = filtro === f;
          const c = f === 'TODOS' ? 'var(--cc)' : ESTADOS[f].color;
          return (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all border"
              style={active
                ? { background: f === 'TODOS' ? 'var(--cc12)' : ESTADOS[f]?.bg, color: c, borderColor: c }
                : { background: 'transparent', color: 'var(--text-mut)', borderColor: 'var(--border-sub)' }}>
              {f === 'TODOS' ? `Todos (${stats.total})` : `${ESTADOS[f].label} (${stats[f] || 0})`}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtrados.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-sec)] py-6">Sin registros con este filtro</p>
        ) : filtrados.map((h, i) => {
          const est = ESTADOS[h.estado] || ESTADOS.PENDIENTE;
          const cal = h.calendario || {};
          const EstIcon = est.Icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
              style={{ background: est.bg || 'var(--bg-surface)', borderColor: 'var(--border-sub)' }}>
              {EstIcon && <EstIcon size={16} style={{ color: est.color, flexShrink: 0 }} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-pri)] truncate">{cal.titulo || 'Evento'}</p>
                <p className="text-xs text-[var(--text-sec)] mt-0.5">
                  {fmtFecha(cal.fecha_inicio)}
                  {cal.fecha_inicio ? ` · ${fmtHora(cal.fecha_inicio)}` : ''}
                  {cal.equipo ? ` · ${cal.equipo}` : ''}
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ color: est.color, background: est.bg, border: `1px solid ${est.color}30` }}>
                {est.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
