import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { authFetch } from '../../lib/authFetch';
import { getClubId } from '../../services/api';

const ESTADOS = {
  PRESENTE:  { label: 'Asistió',     color: '#22C55E', bg: '#22C55E15', Icon: CheckCircle2 },
  PENDIENTE: { label: 'No asistió',  color: '#6B7280', bg: 'transparent', Icon: XCircle    },
  AUSENTE:   { label: 'No asistió',  color: '#6B7280', bg: 'transparent', Icon: XCircle    },
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
  const [historial,     setHistorial]     = useState([]);
  const [totalEventos,  setTotalEventos]  = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [filtro,        setFiltro]        = useState('TODOS');

  useEffect(() => {
    setLoading(true);
    authFetch(`${API_BASE_URL}/asistencia/jugador/${jugador.cedula}?club_id=${clubId}`)
      .then(r => r.json())
      .then(d => { setHistorial(d.data || []); setTotalEventos(d.total_eventos || 0); })
      .catch(() => { setHistorial([]); setTotalEventos(0); })
      .finally(() => setLoading(false));
  }, [jugador.cedula, clubId]);

  const stats = useMemo(() => {
    const presentes = historial.filter(h => h.estado === 'PRESENTE').length;
    const pct = totalEventos > 0 ? Math.round((presentes / totalEventos) * 100) : null;
    return { presentes, noAsistio: totalEventos - presentes, total: totalEventos, pct };
  }, [historial, totalEventos]);

  const pctColor = stats.pct == null ? '#6B7280'
    : stats.pct >= 75 ? '#22C55E'
    : stats.pct >= 50 ? '#F59E0B'
    : '#EF4444';

  const filtrados = filtro === 'TODOS' ? historial
    : filtro === 'AUSENTE' ? historial.filter(h => h.estado !== 'PRESENTE')
    : historial.filter(h => h.estado === filtro);

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
          <CircleProgress pct={stats.pct} color={pctColor} size={84} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-lg font-black leading-none" style={{ color: pctColor }}>
              {stats.pct != null ? `${stats.pct}%` : '—'}
            </span>
            {stats.total > 0 && (
              <span className="text-[10px] font-semibold text-[var(--text-mut)] leading-none">
                {stats.presentes}/{stats.total}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-2xl font-black leading-none" style={{ color: '#22C55E' }}>
              {stats.presentes}
              <span className="text-sm font-semibold text-[var(--text-mut)] ml-1">de {stats.total}</span>
            </p>
            <p className="text-[10px] text-[var(--text-mut)] mt-0.5">eventos con asistencia</p>
          </div>
          <div>
            <p className="text-lg font-bold leading-none text-[var(--text-sec)]">{stats.noAsistio}</p>
            <p className="text-[10px] text-[var(--text-mut)] mt-0.5">sin asistencia</p>
          </div>
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
        {[
          { key: 'TODOS',    label: `Todos (${historial.length})`,            color: 'var(--cc)',  bg: 'var(--cc12)' },
          { key: 'PRESENTE', label: `Asistió (${stats.presentes})`,           color: '#22C55E',   bg: '#22C55E15'   },
          { key: 'AUSENTE',  label: `No asistió (${stats.noAsistio})`,        color: '#6B7280',   bg: 'var(--bg-surface)' },
        ].map(({ key, label, color: c, bg }) => {
          const active = filtro === key;
          return (
            <button key={key} onClick={() => setFiltro(key)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all border"
              style={active
                ? { background: bg, color: c, borderColor: c }
                : { background: 'transparent', color: 'var(--text-mut)', borderColor: 'var(--border-sub)' }}>
              {label}
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
