import { useState, useEffect, useRef } from 'react';
import { Monitor, SlidersHorizontal, Palette, Check, Tag, Users, MessageCircle } from 'lucide-react';

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
  // — Neutrales —
  { id: 'dark',     label: 'Negro',      group: 'Neutral',  app: '#0A0A0A', card: '#111111', surface: '#1A1A1A', text: '#FFFFFF',  preview: ['#0A0A0A', '#111111', '#1A1A1A'] },
  { id: 'carbon',   label: 'Carbón',     group: 'Neutral',  app: '#0D1117', card: '#161B22', surface: '#21262D', text: '#E6EDF3', preview: ['#0D1117', '#161B22', '#21262D'] },
  { id: 'smoke',    label: 'Humo',       group: 'Neutral',  app: '#141416', card: '#1E1E22', surface: '#2A2A30', text: '#F0EFF5', preview: ['#141416', '#1E1E22', '#2A2A30'] },
  { id: 'graphite', label: 'Grafito',    group: 'Neutral',  app: '#18181B', card: '#27272A', surface: '#3F3F46', text: '#FAFAFA', preview: ['#18181B', '#27272A', '#3F3F46'] },
  // — Azules —
  { id: 'slate',    label: 'Pizarra',    group: 'Azul',     app: '#0F172A', card: '#1E293B', surface: '#2A3A52', text: '#F1F5F9', preview: ['#0F172A', '#1E293B', '#2A3A52'] },
  { id: 'navy',     label: 'Marina',     group: 'Azul',     app: '#040C1A', card: '#0A1628', surface: '#142240', text: '#E2E8F4', preview: ['#040C1A', '#0A1628', '#142240'] },
  { id: 'indigo',   label: 'Índigo',     group: 'Azul',     app: '#0E1428', card: '#161E3C', surface: '#1E2850', text: '#E6E8F8', preview: ['#0E1428', '#161E3C', '#1E2850'] },
  // — Morados —
  { id: 'midnight', label: 'Medianoche', group: 'Morado',   app: '#0C0820', card: '#160E38', surface: '#1E1450', text: '#E8E2F8', preview: ['#0C0820', '#160E38', '#1E1450'] },
  { id: 'dusk',     label: 'Crepúsculo', group: 'Morado',   app: '#17141E', card: '#211C2C', surface: '#2C2538', text: '#EEE8F5', preview: ['#17141E', '#211C2C', '#2C2538'] },
  { id: 'plum',     label: 'Ciruelo',    group: 'Morado',   app: '#18101A', card: '#241628', surface: '#301E36', text: '#F0E8F2', preview: ['#18101A', '#241628', '#301E36'] },
  // — Verdes —
  { id: 'petrol',   label: 'Petróleo',   group: 'Verde',    app: '#0A1C20', card: '#122830', surface: '#1A3640', text: '#E0EEF0', preview: ['#0A1C20', '#122830', '#1A3640'] },
  { id: 'forest',   label: 'Bosque',     group: 'Verde',    app: '#071810', card: '#0E2818', surface: '#163820', text: '#E2F0E6', preview: ['#071810', '#0E2818', '#163820'] },
  { id: 'mineral',  label: 'Mineral',    group: 'Verde',    app: '#0E1612', card: '#16201C', surface: '#1E2E26', text: '#E4EEE8', preview: ['#0E1612', '#16201C', '#1E2E26'] },
  // — Cálidos —
  { id: 'khaki',    label: 'Caqui',      group: 'Cálido',   app: '#14140E', card: '#1E1E16', surface: '#28281E', text: '#EEEDE0', preview: ['#14140E', '#1E1E16', '#28281E'] },
  { id: 'coffee',   label: 'Café',       group: 'Cálido',   app: '#18100A', card: '#26180E', surface: '#34220E', text: '#F0EAE2', preview: ['#18100A', '#26180E', '#34220E'] },
  { id: 'sienna',   label: 'Siena',      group: 'Cálido',   app: '#1E1208', card: '#2C1C10', surface: '#3A2618', text: '#F2E8E0', preview: ['#1E1208', '#2C1C10', '#3A2618'] },
  // — Claro —
  { id: 'light',    label: 'Claro',      group: 'Claro',    app: '#F1F5F9', card: '#FFFFFF', surface: '#E9EFF6', text: '#0F172A', preview: ['#F1F5F9', '#FFFFFF', '#E9EFF6'] },
  // — Oceánico —
  { id: 'ocean',    label: 'Océano',     group: 'Oceánico', app: '#0A1931', card: '#122B4A', surface: '#1A3D63', text: '#F6FAFD', preview: ['#0A1931', '#122B4A', '#1A3D63'] },
  { id: 'matrix',   label: 'Matrix',     group: 'Oceánico', app: '#0F0F0F', card: '#202020', surface: '#2A2A2A', text: '#F8F8F8', preview: ['#0F0F0F', '#202020', '#2A2A2A'] },
  { id: 'brasa',    label: 'Brasa',      group: 'Oceánico', app: '#1E1A16', card: '#37322E', surface: '#524944', text: '#D8D4D0', preview: ['#1E1A16', '#37322E', '#524944'] },
  { id: 'corsario', label: 'Corsario',   group: 'Oceánico', app: '#030F19', card: '#0A1E2E', surface: '#122E42', text: '#EEE8E0', preview: ['#030F19', '#0A1E2E', '#122E42'] },
  { id: 'mareas',   label: 'Mareas',     group: 'Oceánico', app: '#0F2C33', card: '#163C45', surface: '#21616A', text: '#E6D1B4', preview: ['#0F2C33', '#163C45', '#21616A'] },
  { id: 'helio',    label: 'Helio',      group: 'Oceánico', app: '#020008', card: '#0E1A26', surface: '#2C394C', text: '#E8F4FC', preview: ['#020008', '#0E1A26', '#2C394C'] },
  { id: 'titanio',  label: 'Titanio',    group: 'Oceánico', app: '#1C1D22', card: '#252A30', surface: '#313B44', text: '#E8E6EA', preview: ['#1C1D22', '#252A30', '#313B44'] },
  { id: 'escarlata',label: 'Escarlata',  group: 'Oceánico', app: '#181E22', card: '#222B31', surface: '#2E3C45', text: '#F0EEF0', preview: ['#181E22', '#222B31', '#2E3C45'] },
];

export function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId || 'dark');
  localStorage.setItem('dashboardTheme', themeId || 'dark');
}

export function getStoredTheme() {
  return localStorage.getItem('dashboardTheme') || 'dark';
}

export default function ThemeSelector({ color = '#00AAFF', onClose, onOpenConfig, onOpenEquipo, onOpenCobro, onColorChange }) {
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
                transition: 'background-color 0.2s, border-color 0.2s',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Monitor size={14} color="var(--text-sec)" />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-sec)' }}>
          Fondo
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
        {THEMES.map((t, idx) => {
          const isActive = activeTheme === t.id;
          const prevGroup = idx > 0 ? THEMES[idx - 1].group : null;
          return (
            <div key={t.id}>
              {t.group && t.group !== prevGroup && (
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-mut)', padding: '6px 10px 3px', userSelect: 'none' }}>
                  {t.group}
                </div>
              )}
              <button
                onClick={() => selectTheme(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '7px 10px', borderRadius: 9,
                  border: isActive ? `1px solid ${color}60` : '1px solid transparent',
                  background: isActive ? `${color}10` : 'transparent',
                  cursor: 'pointer', transition: 'background-color 0.18s, border-color 0.18s',
                }}
              >
                <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  {t.preview.map((c, i) => (
                    <div key={i} style={{ width: 12, height: 20, background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 400, color: isActive ? color : 'var(--text-pri)', flex: 1, textAlign: 'left' }}>
                  {t.label}
                </span>
                {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />}
              </button>
            </div>
          );
        })}
      </div>

      {onOpenCobro && (
        <button
          onClick={onOpenCobro}
          style={{
            width: '100%', marginTop: 10,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            border: `1px solid ${color}30`,
            background: `${color}08`, cursor: 'pointer', transition: 'background-color 0.18s, border-color 0.18s',
          }}
        >
          <MessageCircle size={14} color={color} />
          <span style={{ fontSize: 13, color, fontWeight: 600 }}>Cobro automático WA</span>
        </button>
      )}


{onOpenEquipo && (
        <button
          onClick={onOpenEquipo}
          style={{
            width: '100%', marginTop: 4,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            border: '1px solid var(--border-sub)',
            background: 'transparent', cursor: 'pointer', transition: 'background-color 0.18s, border-color 0.18s',
          }}
        >
          <Users size={14} color="var(--text-sec)" />
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Mi equipo (entrenadores)</span>
        </button>
      )}

      {onOpenConfig && (
        <button
          onClick={onOpenConfig}
          style={{
            width: '100%', marginTop: 4,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            border: '1px solid var(--border-sub)',
            background: 'transparent', cursor: 'pointer', transition: 'background-color 0.18s, border-color 0.18s',
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
