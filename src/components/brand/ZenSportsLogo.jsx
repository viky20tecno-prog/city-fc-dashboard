import logoZDigital from '../../assets/brand/Z_Digital.webp';
import logoFull     from '../../assets/brand/Logo_2.webp';
import logoDarkSvg  from '../../assets/brand/logo-dark.svg';
import logoWhiteSvg from '../../assets/brand/logo-white.svg';
import logoIconSvg  from '../../assets/brand/logo-icon.svg';

/**
 * ZenSportsLogo — logo de marca ZenSports.
 *
 * Props:
 *   variant  — 'full'   (Logo_2.png — wordmark, fondo blanco)
 *              'icon'   (Z_Digital.png — isotipo 3D, alpha real, sirve en fondo claro u oscuro)
 *              'zz'     (alias de 'icon' — mismo archivo, se mantiene por compatibilidad)
 *              'zz-full' (Z_Digital + wordmark ZENSPORTS en Clash Display, inline)
 *              'white'  (SVG wordmark blanco, para dark BG)
 *              'dark'   (SVG wordmark oscuro, para light BG)
 *   size     — 'sm'(24px) | 'md'(32px) | 'lg'(44px) | 'xl'(56px) | número (px de altura)
 *   className — clase CSS adicional
 *   style     — estilos inline adicionales
 */
export default function ZenSportsLogo({ variant = 'white', size = 'md', className = '', style = {} }) {
  const HEIGHTS = { sm: 24, md: 32, lg: 44, xl: 56 };
  const height = typeof size === 'number' ? size : (HEIGHTS[size] || HEIGHTS.md);

  // Variante inline con el isotipo + wordmark texto
  if (variant === 'zz-full') {
    return (
      <div
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.3, ...style }}
      >
        <img
          src={logoZDigital}
          alt=""
          aria-hidden
          draggable={false}
          style={{ height, width: height, objectFit: 'contain', flexShrink: 0 }}
        />
        <span style={{
          fontFamily: "'Sport Event', 'Space Grotesk', sans-serif",
          fontSize: height * 0.65,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#EFFFFF',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          <span style={{ fontWeight: 400, opacity: 0.85 }}>ZEN</span>SPORTS
        </span>
      </div>
    );
  }

  const SRC_MAP = {
    full:      logoFull,
    icon:      logoZDigital,
    'icon-svg': logoIconSvg,
    zz:        logoZDigital,
    dark:      logoDarkSvg,
    white:     logoWhiteSvg,
  };

  const src = SRC_MAP[variant] || logoWhiteSvg;
  const isSquare = variant === 'icon' || variant === 'zz' || variant === 'icon-svg';

  return (
    <img
      src={src}
      alt="ZenSports"
      className={className}
      style={{
        display: 'inline-block',
        height,
        width: isSquare ? height : 'auto',
        maxHeight: height,
        objectFit: 'contain',
        flexShrink: 0,
        ...style,
      }}
      draggable={false}
    />
  );
}
