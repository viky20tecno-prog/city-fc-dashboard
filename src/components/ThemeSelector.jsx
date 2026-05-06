import { useState, useEffect, useRef } from 'react';
import { Monitor, SlidersHorizontal } from 'lucide-react';

export const THEMES = [
  {
    id:      'dark',
    label:   'Negro',
    app:     '#0A0A0A',
    card:    '#111111',
    preview: ['#0A0A0A', '#111111', '#1A1A1A'],
  },
  {
    id:      'carbon',
    label:   'Carbón',
    app:     '#0D1117',
    card:    '#161B22',
    preview: ['#0D1117', '#161B22', '#21262D'],
  },
  {
    id:      'slate',
    label:   'Pizarra',
    app:     '#0F172A',
    card:    '#1E293B',
    preview: ['#0F172A', '#1E293B', '#2A3A52'],
  },
  {
    id:      'graphite',
    label:   'Grafito',
    app:     '#18181B',
    card:    '#27272A',
    preview: ['#18181B', '#27272A', '#3F3F46'],
  },
  {
    id:      'light',
    label:   'Claro',
    app:     '#F1F5F9',
    card:    '#FFFFFF',
    preview: ['#F1F5F9', '#FFFFFF', '#E9EFF6'],
  },
];

export function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId || 'dark');
  localStorage.setItem('dashboardTheme', themeId || 'dark');
}

export function getStoredTheme() {
  return localStorage.getItem('dashboardTheme') || 'dark';
}

export default function ThemeSelector({ color = '#00AAFF', onClose, onOpenConfig }) {
  const [active, setActive] = useState(getStoredTheme);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const select = (id) => {
    setActive(id);
    applyTheme(id);
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: 60,
        left: 72,
        zIndex: 9999,
        background: 'var(--bg-card)',
        border: `1px solid var(--cc20)`,
        borderRadius: 16,
        padding: '20px 18px',
        width: 240,
        boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 32px var(--cc12)`,
        fontFamily: "'Inter', system-ui, sans-serif",
        animation: 'theme-slide-in 0.18s ease',
      }}
    >
      <style>{`
        @keyframes theme-slide-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Monitor size={14} color="var(--text-sec)" />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-sec)' }}>
          Fondo
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {THEMES.map(t => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '9px 10px',
                borderRadius: 10,
                border: isActive ? `1px solid ${color}60` : '1px solid transparent',
                background: isActive ? `${color}10` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {/* Swatch de 3 tonos */}
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {t.preview.map((c, i) => (
                  <div key={i} style={{ width: 14, height: 24, background: c }} />
                ))}
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? color : 'var(--text-pri)',
                flex: 1,
                textAlign: 'left',
              }}>
                {t.label}
              </span>
              {isActive && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {onOpenConfig && (
        <button
          onClick={onOpenConfig}
          style={{
            width: '100%', marginTop: 12,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            border: '1px solid var(--border-sub)',
            background: 'transparent', cursor: 'pointer',
            transition: 'all 0.18s',
          }}
        >
          <SlidersHorizontal size={14} color="var(--text-sec)" />
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Configurar club</span>
        </button>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-mut)', lineHeight: 1.6 }}>
        El fondo se guarda automáticamente.
      </div>
    </div>
  );
}
