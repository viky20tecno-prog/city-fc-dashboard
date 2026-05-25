/**
 * ZenSportsLogo — componente reutilizable del logo de marca.
 *
 * Props:
 *   variant  — 'full' (icon+texto) | 'icon' (solo icono) | 'white' (monocromático blanco) | 'dark' (monocromático oscuro)
 *   size     — 'sm' | 'md' | 'lg' | número (px para el icono)
 *   className — clase CSS adicional
 *   style     — estilos inline adicionales
 */
export default function ZenSportsLogo({ variant = 'full', size = 'md', className = '', style = {} }) {
  const SIZES = {
    sm: { icon: 24, text: 13, gap: 7, rx: 5, sw: 2.2 },
    md: { icon: 30, text: 17, gap: 8, rx: 6.5, sw: 2.6 },
    lg: { icon: 40, text: 22, gap: 10, rx: 9, sw: 3.2 },
  };
  const s = typeof size === 'number'
    ? { icon: size, text: Math.round(size * 0.55), gap: Math.round(size * 0.27), rx: Math.round(size * 0.22), sw: size * 0.087 }
    : (SIZES[size] || SIZES.md);

  const textColor = variant === 'white'
    ? '#FFFFFF'
    : variant === 'dark'
    ? '#0F172A'
    : 'var(--text-pri, #FFFFFF)';

  const iconBg = variant === 'white'
    ? 'transparent'
    : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)';

  const iconBorder = variant === 'white'
    ? '1.5px solid rgba(255,255,255,0.7)'
    : 'none';

  const strokeColor = variant === 'dark' ? '#4F46E5' : '#FFFFFF';

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap, ...style }}
      aria-label="ZenSports"
    >
      {/* Z-bolt icon */}
      <div style={{
        width: s.icon,
        height: s.icon,
        borderRadius: s.rx,
        background: iconBg,
        border: iconBorder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: variant === 'white' ? 'none'
          : variant === 'dark' ? 'none'
          : `0 0 ${s.icon * 0.5}px rgba(99,102,241,0.35)`,
      }}>
        <svg
          width={s.icon * 0.56}
          height={s.icon * 0.56}
          viewBox="0 0 18 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1.5H17L1 10.5H17"
            stroke={strokeColor}
            strokeWidth={s.sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {variant !== 'icon' && (
        <span style={{
          fontFamily: "var(--font-brand, 'Space Grotesk', 'Inter', system-ui, sans-serif)",
          fontSize: s.text,
          lineHeight: 1,
          letterSpacing: '-0.5px',
          userSelect: 'none',
          color: textColor,
        }}>
          <span style={{ fontWeight: 500, opacity: 0.9 }}>Zen</span>
          <span style={{ fontWeight: 800 }}>Sports</span>
        </span>
      )}
    </div>
  );
}
