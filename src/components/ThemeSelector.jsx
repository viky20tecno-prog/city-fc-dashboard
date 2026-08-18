import { useState, useEffect, useRef } from 'react';
import { Monitor, SlidersHorizontal, Palette, Check, Tag, Users, MessageCircle } from 'lucide-react';
import { PALETA, THEMES_VISIBLES, applyTheme, getStoredTheme } from '../lib/themes';

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
        {THEMES_VISIBLES.map((t, idx) => {
          const isActive = activeTheme === t.id;
          const prevGroup = idx > 0 ? THEMES_VISIBLES[idx - 1].group : null;
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
