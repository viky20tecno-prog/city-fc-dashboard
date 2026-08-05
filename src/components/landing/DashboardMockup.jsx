import { Zap } from 'lucide-react';

export default function DashboardMockup({ color, modo = 'dark' }) {
  const dark = modo !== 'light';
  const T = dark ? {
    bg:      `linear-gradient(160deg, ${color}20 0%, #080808 50%, ${color}10 100%)`,
    topbar:  `linear-gradient(90deg, ${color}18, rgba(12,12,12,0.97))`,
    topBdr:  `${color}30`,
    sidebar: `linear-gradient(180deg, ${color}14, rgba(8,8,8,0.98))`,
    sideBdr: `${color}20`,
    card:    'rgba(255,255,255,0.025)', cardBdr: 'rgba(255,255,255,0.06)',
    subTxt:  'rgba(255,255,255,0.4)',   rowTxt:  'rgba(255,255,255,0.55)',
    rowBdr:  'rgba(255,255,255,0.03)',  navDot:  '#282828',
    liveBg:  'rgba(255,255,255,0.05)', liveBdr: 'rgba(255,255,255,0.08)',
    liveTxt: 'rgba(255,255,255,0.5)',  barFill: 'rgba(255,255,255,0.08)',
    border:  `${color}40`,
    shadow:  `0 32px 80px rgba(0,0,0,0.6), 0 0 60px ${color}22`,
  } : {
    // Fondo azul-gris medio — topbar y cards en blanco crean la profundidad (estilo Apple/Linear)
    bg:      `linear-gradient(160deg, ${color}22 0%, #C8D8EC 50%, ${color}15 100%)`,
    topbar:  'rgba(255,255,255,0.97)',
    topBdr:  'rgba(0,20,80,0.10)',
    sidebar: 'rgba(236,244,255,0.95)',
    sideBdr: 'rgba(0,20,80,0.08)',
    card:    'rgba(255,255,255,0.90)',  cardBdr: 'rgba(0,20,80,0.11)',
    subTxt:  'rgba(0,20,60,0.46)',     rowTxt:  'rgba(0,20,60,0.72)',
    rowBdr:  'rgba(0,20,80,0.06)',     navDot:  '#B0C4DA',
    liveBg:  'rgba(255,255,255,0.80)', liveBdr: 'rgba(0,20,80,0.12)',
    liveTxt: 'rgba(0,20,60,0.52)',     barFill: 'rgba(0,20,80,0.09)',
    border:  `${color}55`,
    shadow:  `0 24px 60px rgba(0,30,80,0.18), 0 0 40px ${color}25`,
  };

  return (
    <div style={{
      width: '100%', maxWidth: 460,
      borderRadius: 16, overflow: 'hidden',
      border: `1px solid ${T.border}`,
      boxShadow: T.shadow,
      background: T.bg, flexShrink: 0,
      transition: 'background 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.4s, box-shadow 0.4s',
    }}>
      {/* Topbar */}
      <div style={{ height: 48, background: T.topbar, borderBottom: `1px solid ${T.topBdr}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, position: 'relative', transition: 'background 0.5s' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57', '#FFBD2E', '#28C840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ height: 22, background: T.liveBg, border: `1px solid ${T.liveBdr}`, borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
          <span style={{ fontSize: 10, color: T.liveTxt, letterSpacing: 1 }}>EN VIVO</span>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: `${color}28`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.4s, border-color 0.4s, box-shadow 0.4s, color 0.4s' }}>
          <Zap size={12} color={color} />
        </div>
      </div>
      {/* Cuerpo */}
      <div style={{ display: 'flex', height: 260 }}>
        {/* Sidebar */}
        <div style={{ width: 44, background: T.sidebar, borderRight: `1px solid ${T.sideBdr}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 6, transition: 'background 0.5s' }}>
          {[true, false, false, false, false].map((active, i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: active ? `${color}18` : 'transparent', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.4s' }}>
              {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: 16, background: color, borderRadius: '0 3px 3px 0', boxShadow: `0 0 10px ${color}` }} />}
              <div style={{ width: 12, height: 12, borderRadius: 3, background: active ? color : T.navDot, transition: 'background 0.4s' }} />
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
            {[
              { label: 'Inscritos', val: '24', c: color },
              { label: 'Al día',    val: '18', c: '#22C55E' },
              { label: 'Pendiente', val: '6',  c: '#FF5E5E' },
            ].map(s => (
              <div key={s.label} style={{ background: `${s.c}09`, border: `1px solid ${s.c}25`, borderRadius: 9, padding: '8px 10px', transition: 'background-color 0.4s, border-color 0.4s, box-shadow 0.4s, color 0.4s' }}>
                <div style={{ fontSize: 10, color: T.subTxt, marginBottom: 4, letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c, lineHeight: 1, transition: 'color 0.4s' }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.cardBdr}`, borderRadius: 9, overflow: 'hidden', flex: 1 }}>
            <div style={{ height: 26, background: `${color}0A`, borderBottom: `1px solid ${color}18`, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 60, height: 5, borderRadius: 3, background: `${color}45` }} />
              <div style={{ width: 40, height: 5, borderRadius: 3, background: T.barFill }} />
              <div style={{ flex: 1 }} />
              <div style={{ padding: '1px 8px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 4, fontSize: 9, color, fontWeight: 700, letterSpacing: 0.5 }}>HOY</div>
            </div>
            {[
              { badge: '#22C55E', text: 'CONFIRMADO', name: 'Carlos M.' },
              { badge: color,     text: 'PENDIENTE',  name: 'Laura V.'  },
              { badge: '#FF5E5E', text: 'VENCIDO',    name: 'Juan P.'   },
              { badge: color,     text: 'PENDIENTE',  name: 'Ana R.'    },
            ].map((row, i) => (
              <div key={i} style={{ height: 28, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.rowBdr}` }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${row.badge}15`, border: `1px solid ${row.badge}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.badge }} />
                </div>
                <div style={{ fontSize: 10, color: T.rowTxt, flex: 1 }}>{row.name}</div>
                <div style={{ padding: '2px 7px', borderRadius: 4, background: `${row.badge}15`, border: `1px solid ${row.badge}35`, fontSize: 9, color: row.badge, fontWeight: 700, letterSpacing: 0.5 }}>{row.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
