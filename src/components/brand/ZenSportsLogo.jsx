import logoIcon from '../../assets/brand/Logo_1.png';
import logoFull from '../../assets/brand/Logo_2.png';
import logoDarkSvg from '../../assets/brand/logo-dark.svg';
import logoWhiteSvg from '../../assets/brand/logo-white.svg';

/**
 * ZenSportsLogo — logo de marca ZenSports.
 *
 * Props:
 *   variant  — 'full' (Logo_2.png) | 'icon' (Logo_1.png) | 'white' | 'dark'
 *   size     — 'sm' | 'md' | 'lg' | número (px de altura)
 *   className — clase CSS adicional
 *   style     — estilos inline adicionales
 */
export default function ZenSportsLogo({ variant = 'full', size = 'md', className = '', style = {} }) {
  const HEIGHTS = { sm: 28, md: 36, lg: 48 };
  const height = typeof size === 'number' ? size : (HEIGHTS[size] || HEIGHTS.md);

  const SRC_MAP = {
    full: logoFull,
    icon: logoIcon,
    dark: logoDarkSvg,
    white: logoWhiteSvg,
  };

  const src = SRC_MAP[variant] || logoFull;
  const isSquare = variant === 'icon';

  return (
    <img
      src={src}
      alt="ZenSports"
      height={height}
      width={isSquare ? height : undefined}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain', ...style }}
      draggable={false}
    />
  );
}
