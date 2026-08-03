// Fondos disponibles para el carnet de jugador — todo generado en CSS/SVG (sin
// imágenes subidas), pensado para imprimir nítido siempre. Lenguaje visual tipo
// carnet deportivo premium (material, profundidad, brillo) en vez de bloques de
// color planos: grano sutil + brillo diagonal tipo metal cepillado + resplandor
// del color del club, SIEMPRE contenido en la esquina inferior derecha (zona del
// footer), que es la única franja del carnet sin texto encima — nombre, apellido
// y las etiquetas usan clubColor como color de letra, así que cualquier acento
// de color que toque esa zona los vuelve ilegibles (aprendido con el primer
// intento de "Bicolor": hay que respetar esta zona segura siempre).
//
// Es UNA sola elección por club (no por jugador) — se guarda en `clubConfig.carnet_fondo`
// y aplica a los carnets de todos los jugadores del club, para mantener una identidad
// visual consistente. Se configura desde el wizard "Configura tu club" (paso Identidad
// visual) y se usa en HojaDeVida/TabCarnetV1.jsx.
//
// v1 (este archivo, exports originales) sigue siendo el diseño por defecto para
// todos los clubes. v2 (exports con sufijo, más abajo) es el rediseño tipo
// carnet deportivo/jersey (rayas + halftone + escudo fantasma) — se activa por
// club vía `clubConfig.carnet_v2 === true`, mientras se define el rollout
// completo (ver HojaDeVida/TabCarnet.jsx y pages/VerificarMiembro.jsx).

// Grano — SVG feTurbulence como data-URI, en mosaico. Dos variantes (claro/oscuro)
// porque ruido blanco es invisible sobre fondo blanco y viceversa.
const GRAIN_LIGHT_ON_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E") 0 0/140px 140px`;
const GRAIN_DARK_ON_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E") 0 0/140px 140px`;

// Brillo diagonal — banda de luz tipo metal cepillado / vidrio, cruza toda la
// tarjeta a bajo contraste. En claro es más marcado (luz real sobre superficie
// clara), en oscuro es más sutil (reflejo).
const sheenDark  = 'linear-gradient(115deg,transparent 22%,rgba(255,255,255,0.07) 33%,transparent 44%)';
const sheenLight = 'linear-gradient(115deg,transparent 22%,rgba(255,255,255,0.85) 33%,transparent 46%)';

// Resplandor del color del club — SIEMPRE anclado a la esquina inferior derecha,
// SIEMPRE una elipse acotada (nunca "circle" grande) para que se apague antes de
// llegar a la zona de texto. `size` chico = resplandor sutil, grande = dramático.
const glow = (c, size = '170px 120px', alpha = '38') =>
  `radial-gradient(ellipse ${size} at 100% 100%,${c}${alpha} 0%,transparent 70%)`;

// Textura de fibra de carbono — crosshatch diagonal de 2 capas, muy sutil.
const carbono = 'linear-gradient(45deg,rgba(255,255,255,0.035) 25%,transparent 25%,transparent 75%,rgba(255,255,255,0.035) 75%) 0 0/9px 9px,linear-gradient(-45deg,rgba(255,255,255,0.035) 25%,transparent 25%,transparent 75%,rgba(255,255,255,0.035) 75%) 0 0/9px 9px';

// Banda holográfica — SOLO en la franja inferior segura (mismo principio que ya
// se usó para arreglar "Bicolor": nunca por encima del bloque de nombre).
// OJO: `background-position` con un `background-size` menor al 100% NO es un
// porcentaje directo del contenedor — se reparte sobre el espacio sobrante
// (position% * (100% - size%)). Por eso va "bottom" (100%), no "88%", para que
// el borde inferior de la banda quede pegado al borde inferior real de la tarjeta.
const holograma = (c) =>
  `linear-gradient(100deg,${c} 0%,#ffffffcc 18%,${c} 36%,#ffffffaa 54%,${c}dd 72%,#ffffffcc 88%,${c} 100%) bottom/100% 12% no-repeat`;

export const CARNET_FONDOS = [
  {
    key: 'onyx', label: 'Onyx', dark: true,
    bg: (c) => `${GRAIN_LIGHT_ON_DARK}, ${sheenDark}, ${glow(c, '170px 120px', '38')}, linear-gradient(165deg,#161616 0%,#0B0B0D 55%,#050506 100%)`,
  },
  {
    key: 'platino', label: 'Platino', dark: false,
    bg: (c) => `${GRAIN_DARK_ON_LIGHT}, ${sheenLight}, ${glow(c, '170px 120px', '14')}, linear-gradient(165deg,#FFFFFF 0%,#F3F3F4 55%,#EAEAEC 100%)`,
  },
  {
    key: 'carbono', label: 'Carbono', dark: true,
    bg: (c) => `${GRAIN_LIGHT_ON_DARK}, ${carbono}, ${glow(c, '180px 130px', '34')}, linear-gradient(165deg,#141414 0%,#0A0A0A 100%)`,
  },
  {
    key: 'prisma', label: 'Prisma', dark: true,
    bg: (c) => `${GRAIN_LIGHT_ON_DARK}, ${sheenDark}, ${holograma(c)}, linear-gradient(165deg,#141414 0%,#0A0A0C 55%,#050506 100%)`,
  },
  {
    key: 'aurora', label: 'Aurora', dark: true,
    bg: (c) => `${GRAIN_LIGHT_ON_DARK}, ${sheenDark}, ${glow(c, '260px 190px', '58')}, linear-gradient(165deg,#131313 0%,#0A0A0C 55%,#050506 100%)`,
  },
  {
    key: 'titanio', label: 'Titanio', dark: false,
    bg: (c) => `${GRAIN_DARK_ON_LIGHT}, ${sheenLight}, ${glow(c, '150px 110px', '10')}, linear-gradient(170deg,#FBFBFC 0%,#F1F1F3 100%)`,
  },
];

export function getFondoCarnet(key) {
  return CARNET_FONDOS.find(f => f.key === key) || CARNET_FONDOS[0];
}

// Deriva la paleta completa (fondo + colores de texto/bordes) para un fondo + color
// de club dados. `dark` decide si el texto es claro sobre oscuro o al revés.
export function temaCarnet(fondoKey, clubColor) {
  const fondo = getFondoCarnet(fondoKey);
  const bgCard = fondo.bg(clubColor);
  return fondo.dark
    ? { dark: true, label: fondo.label, bgCard,
        textPri: '#F0F0F0', textSec: '#AAAAAA', textMut: '#666666',
        border: `${clubColor}40`, borderImg: `${clubColor}55`, divider: '#1E1E28', photoBg: '#1A1A26' }
    : { dark: false, label: fondo.label, bgCard,
        textPri: '#111111', textSec: '#444444', textMut: '#888888',
        border: `${clubColor}50`, borderImg: `${clubColor}60`, divider: '#EBEBEB', photoBg: '#E0E0E0' };
}

// ─────────────────────────────────────────────────────────────────────────
// v2 — carnet tipo deportivo/jersey (rayas diagonales + halftone + escudo
// fantasma), siempre derivado del color del club, sin nada que elegir.
// Activado por club vía `clubConfig.carnet_v2 === true` (ver TabCarnet.jsx y
// VerificarMiembro.jsx). Referencia: mockup generado con otra IA que Diego
// compartió el 3 ago 2026 (estilo FIFA/2K player card).
// ─────────────────────────────────────────────────────────────────────────

const GRAIN_V2 = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E") 0 0/140px 140px`;

// Trama halftone (puntos), muy sutil, cubre toda la tarjeta — lenguaje visual
// de jersey/impreso deportivo.
const HALFTONE_V2 = 'radial-gradient(rgba(255,255,255,0.09) 0.7px,transparent 0.7px) 0 0/7px 7px';

// 2 franjas diagonales sólidas del color del club + 1 línea clara de
// "velocidad", confinadas a la esquina superior DERECHA (espejo del primer
// intento, que las ponía a la izquierda). Misma técnica que la banda
// "holograma" de v1: un linear-gradient con cortes duros, acotado con
// background-size/position/no-repeat para que no invada el resto de la
// tarjeta.
//
// Por qué a la derecha y no a la izquierda: del lado izquierdo viven el
// nombre del club (header), los badges de ícono + texto (dorso) y el
// número/posición (frente) — todos con `color: clubColor`, igual que las
// rayas, así que quedaban ilegibles cuando una raya caía justo detrás
// (rojo sobre rojo). Del lado derecho solo hay elementos con fondo SÓLIDO
// propio (la foto y la caja del QR, ambas opacas), así que las rayas quedan
// completamente tapadas ahí — cero riesgo de choque de color.
// Ángulo espejado (112° → 248° = 360-112) para que el patrón se vea como un
// reflejo en espejo, no solo reposicionado.
const stripesV2 = (c) => `linear-gradient(248deg,
    transparent 0%, transparent 6%,
    ${c} 6%, ${c} 15%,
    transparent 15%, transparent 19%,
    ${c} 19%, ${c} 26%,
    transparent 26%, transparent 29%,
    rgba(255,255,255,0.5) 29%, rgba(255,255,255,0.5) 30.5%,
    transparent 30.5%, transparent 100%) top right/58% 42% no-repeat`;

const BASE_V2 = 'linear-gradient(165deg,#131316 0%,#0A0A0C 55%,#050506 100%)';

export function fondoCarnetV2(clubColor) {
  return `${GRAIN_V2}, ${HALFTONE_V2}, ${stripesV2(clubColor)}, ${BASE_V2}`;
}

// Escudo del club muy oscurecido y agrandado, recostado del lado derecho —
// se aplica como <img> posicionado encima de este fondo (depende del logoUrl
// real del club, por eso vive como estilo de elemento y no como parte del
// string de `background`). `brightness(0) invert(1)` lo vuelve blanco puro
// para que la opacidad baja se lea como un grabado, sin importar los colores
// reales del logo.
export const WATERMARK_LOGO_STYLE = {
  position: 'absolute', right: '-8%', top: '40%', width: '46%', maxWidth: '170px',
  opacity: 0.045, filter: 'brightness(0) invert(1)', pointerEvents: 'none', zIndex: 0,
};

// Paleta completa derivada del color del club — usada por TabCarnetV2.jsx y
// VerificarMiembro.jsx para que ambos compartan exactamente los mismos tonos.
export function temaCarnetV2(clubColor) {
  return {
    bgCard: fondoCarnetV2(clubColor),
    textPri: '#F2F2F2',
    textSec: '#AEAEB4',
    textMut: '#68686E',
    border: 'rgba(255,255,255,0.07)',
    borderImg: `${clubColor}55`,
    divider: 'rgba(255,255,255,0.08)',
    photoBg: '#15151B',
    badgeBg: `${clubColor}14`,
    badgeBorder: `${clubColor}45`,
  };
}
