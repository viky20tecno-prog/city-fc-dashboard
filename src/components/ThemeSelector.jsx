import { useState, useEffect, useRef } from 'react';
import { Monitor, SlidersHorizontal, Palette, Check } from 'lucide-react';

export const PALETA = [
  { hex: '#E14924', nombre: 'Naranja Ciudad'  },
  { hex: '#00AAFF', nombre: 'Azul Cobalto'    },
  { hex: '#10B981', nombre: 'Verde Esmeralda' },
  { hex: '#F59E0B', nombre: 'Dorado Campeón'  },
  { hex: '#8B5CF6', nombre: 'Violeta Real'    },
  { hex: '#EF4444', nombre: 'Rojo Pasión'     },
  { hex: '#F97316', nombre: 'Naranja Solar'   },
  { hex: '#0D9488', nombre: 'Teal Agua'       },
  { hex: '#EC4899', nombre: 'Rosa Dinámico'   },
  { hex: '#84CC16', nombre: 'Lima Fresco'     },
  { hex: '#FACC15', nombre: 'Amarillo Flash'  },
  { hex: '#334155', nombre: 'Azul Marino'     },
];

export const THEMES = [
  { id: 'dark',     label: 'Negro',      app: '#0A0A0A', card: '#111111', surface: '#1A1A1A', text: '#FFFFFF',  preview: ['#0A0A0A', '#111111', '#1A1A1A'] },
  { id: 'carbon',   label: 'Carbón',     app: '#0D1117', card: '#161B22', surface: '#21262D', text: '#E6EDF3', preview: ['#0D1117', '#161B22', '#21262D'] },
  { id: 'slate',    label: 'Pizarra',    app: '#0F172A', card: '#1E293B', surface: '#2A3A52', text: '#F1F5F9', preview: ['#0F172A', '#1E293B', '#2A3A52'] },
  { id: 'graphite', label: 'Grafito',    app: '#18181B', card: '#27272A', surface: '#3F3F46', text: '#FAFAFA', preview: ['#18181B', '#27272A', '#3F3F46'] },
  { id: 'navy',     label: 'Marina',     app: '#040C1A', card: '#0A1628', surface: '#142240', text: '#E2E8F4', preview: ['#040C1A', '#0A1628', '#142240'] },
  { id: 'midnight', label: 'Medianoche', app: '#0C0820', card: '#160E38', surface: '#1E1450', text: '#E8E2F8', preview: ['#0C0820', '#160E38', '#1E1450'] },
  { id: 'forest',   label: 'Bosque',     app: '#071810', card: '#0E2818', surface: '#163820', text: '#E2F0E6', preview: ['#071810', '#0E2818', '#163820'] },
  { id: 'coffee',   label: 'Café',       app: '#18100A', card: '#26180E', surface: '#34220E', text: '#F0EAE2', preview: ['#18100A', '#26180E', '#34220E'] },
  { id: 'light',    label: 'Claro',      app: '#F1F5F9', card: '#FFFFFF', surface: '#E9EFF6', text: '#0F172A', preview: ['#F1F5F9', '#FFFFFF', '#E9EFF6'] },
];

export function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId || 'dark');
  localStorage.setItem('dashboardTheme', themeId || 'dark');
}

export function getStoredTheme() {
  return localStorage.getItem('dashboardTheme') || 'dark';
}

export default function ThemeSelector({ color = '#00AAFF', onClose, onOpenConfig, onColorChange }) {
  const [activeTheme, setActiveTheme] = useState(getStoredTheme);
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const selectTheme = (id) => {
    setActiveTheme(id);
    applyTheme(id);
  };

  const selectColor = async (hex) => {
    if (hex === color || saving) return;
    setSaving(true);
    try {
      await onColorChange?.(hex);
    } finally {
      setSaving(false);
    }
  };

  const activeColorName = PALETA.find(p => p.hex === color)?.nombre || color;

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
        width: 264,
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
        .color-swatch:hover { transform: scale(1.15) !important; }
      `}</style>

      {/* ── Color del club ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Palette size={14} color="var(--text-sec)" />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-sec)' }}>
          Color del club
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 7, marginBottom: 8 }}>
        {PALETA.map(p => {
          const isActive = p.hex === color;
          return (
            <button
              key={p.hex}
              title={p.nombre}
              onClick={() => selectColor(p.hex)}
              className="color-swatch"
              style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: p.hex,
                border: isActive ? '2.5px solid #fff' : '2.5px solid transparent',
                boxShadow: isActive
                  ? `0 0 0 2px ${p.hex}, 0 0 14px ${p.hex}90`
                  : `0 2px 6px ${p.hex}50`,
                cursor: saving ? 'wait' : 'pointer',
                transform: isActive ? 'scale(1.12)' : 'scale(1)',
                transition: 'all 0.2s',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isActive && <Check size={13} color="#fff" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-sec)', flex: 1 }}>{activeColorName}</span>
        {saving && <span style={{ fontSize: 10, color: 'var(--text-mut)' }}>Guardando…</span>}
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: 'var(--border-sub)', marginBottom: 14 }} />

      {/* ── Fondo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Monitor size={14} color="var(--text-sec)" />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-sec)' }}>
          Fondo
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {THEMES.map(t => {
          const isActive = activeTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => selectTheme(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '8px 10px', borderRadius: 10,
                border: isActive ? `1px solid ${color}60` : '1px solid transparent',
                background: isActive ? `${color}10` : 'transparent',
                cursor: 'pointer', transition: 'all 0.18s',
              }}
            >
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {t.preview.map((c, i) => (
                  <div key={i} style={{ width: 13, height: 22, background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? color : 'var(--text-pri)', flex: 1, textAlign: 'left' }}>
                {t.label}
              </span>
              {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {onOpenConfig && (
        <button
          onClick={onOpenConfig}
          style={{
            width: '100%', marginTop: 10,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            border: '1px solid var(--border-sub)',
            background: 'transparent', cursor: 'pointer', transition: 'all 0.18s',
          }}
        >
          <SlidersHorizontal size={14} color="var(--text-sec)" />
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Configurar club</span>
        </button>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-mut)', lineHeight: 1.6 }}>
        Los cambios se guardan automáticamente.
      </div>
    </div>
  );
}
