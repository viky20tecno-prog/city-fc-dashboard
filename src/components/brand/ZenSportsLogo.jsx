import logoIcon     from '../../assets/brand/Logo_1.png';
import logoFull     from '../../assets/brand/Logo_2.png';
import logoZZ       from '../../assets/brand/Logo_ZZ.png';
import logoDarkSvg  from '../../assets/brand/logo-dark.svg';
import logoWhiteSvg from '../../assets/brand/logo-white.svg';
import logoIconSvg  from '../../assets/brand/logo-icon.svg';

/**
 * ZenSportsLogo — logo de marca ZenSports.
 *
 * Props:
 *   variant  — 'full'   (Logo_2.png — wordmark, fondo blanco)
 *              'icon'   (Logo_1.png — isotipo, fondo blanco)
 *              'zz'     (Logo_ZZ.png — isotipo 3D violet, fondo negro → blend lighten para dark UI)
 *              'zz-full' (Logo_ZZ + wordmark ZENSPORTS en Clash Display, inline)
 *              'white'  (SVG wordmark blanco, para dark BG)
 *              'dark'   (SVG wordmark oscuro, para light BG)
 *   size     — 'sm'(24px) | 'md'(32px) | 'lg'(44px) | 'xl'(56px) | número (px de altura)
 *   className — clase CSS adicional
 *   style     — estilos inline adicionales
 */
export default function ZenSportsLogo({ variant = 'white', size = 'md', className = '', style = {} }) {
  const HEIGHTS = { sm: 24, md: 32, lg: 44, xl: 56 };
  const height = typeof size === 'number' ? size : (HEIGHTS[size] || HEIGHTS.md);

  // Variante inline con Logo_ZZ + wordmark texto
  if (variant === 'zz-full') {
    return (
      <div
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.3, ...style }}
      >
        <img
          src={logoZZ}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            height,
            width: height,
            objectFit: 'contain',
            mixBlendMode: 'lighten',
            flexShrink: 0,
          }}
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
    icon:      logoIcon,
    'icon-svg': logoIconSvg,
    zz:        logoZZ,
    dark:      logoDarkSvg,
    white:     logoWhiteSvg,
  };

  const src = SRC_MAP[variant] || logoWhiteSvg;
  const isSquare = variant === 'icon' || variant === 'zz' || variant === 'icon-svg';

  // Logo_ZZ tiene fondo negro — mix-blend-mode: lighten lo hace transparente en dark UIs
  const isZZ = variant === 'zz';

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
        ...(isZZ ? { mixBlendMode: 'lighten' } : {}),
        ...style,
      }}
      draggable={false}
    />
  );
}
